import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { generateVocab, toPascalCase } from "@/lib/ai";
import type { Prisma } from "@prisma/client";

// GET /api/vocab — รายการคำศัพท์ทั้งหมดของผู้ใช้
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const vocabs = await prisma.vocab.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(vocabs);
}

// POST /api/vocab — เพิ่มคำศัพท์ใหม่
// รับได้ทั้งแบบส่งข้อมูลที่ generate มาแล้ว หรือส่งแค่ word ให้ server เรียก Z.ai เอง
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const rawWord = String(body?.word ?? "").trim();
  if (!rawWord) {
    return NextResponse.json({ error: "กรุณากรอกคำศัพท์" }, { status: 400 });
  }
  // บังคับ Pascal Case เสมอ (generateVocab จะทำให้เองในกรณีเรียก AI)
  const word = toPascalCase(rawWord);

  try {
    // ถ้า client ส่ง translation มาแล้ว ใช้เลย ไม่งั้นเรียก Z.ai
    const data =
      body?.translation !== undefined
        ? {
            word,
            translation: String(body.translation ?? ""),
            partOfSpeech: String(body.partOfSpeech ?? ""),
            pronunciation: String(body.pronunciation ?? ""),
            examples: Array.isArray(body.examples) ? body.examples : [],
            notes: String(body.notes ?? ""),
          }
        : await generateVocab(word);

    const vocab = await prisma.vocab.upsert({
      where: { userId_word: { userId: session.user.id, word: data.word } },
      update: {
        translation: data.translation,
        partOfSpeech: data.partOfSpeech || null,
        pronunciation: data.pronunciation || null,
        examples: data.examples as unknown as Prisma.InputJsonValue,
        notes: data.notes || null,
      },
      create: {
        userId: session.user.id,
        word: data.word,
        translation: data.translation,
        partOfSpeech: data.partOfSpeech || null,
        pronunciation: data.pronunciation || null,
        examples: data.examples as unknown as Prisma.InputJsonValue,
        notes: data.notes || null,
      },
    });

    return NextResponse.json(vocab, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "เกิดข้อผิดพลาด";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
