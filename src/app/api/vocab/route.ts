import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { generateVocab, toPascalCase } from "@/lib/ai";
import { touchStreak } from "@/lib/streak";
import type { Prisma } from "@prisma/client";

// ตรวจว่า deckId (ถ้าส่งมา) เป็นหมวดของผู้ใช้คนนี้จริง — คืน null ถ้าไม่ระบุหมวด
async function resolveDeckId(
  userId: string,
  raw: unknown,
): Promise<string | null> {
  const deckId = String(raw ?? "").trim();
  if (!deckId) return null;
  const owned = await prisma.deck.findFirst({
    where: { id: deckId, userId },
    select: { id: true },
  });
  return owned ? deckId : null;
}

// GET /api/vocab — รายการคำศัพท์ของผู้ใช้ (กรองตามหมวดด้วย ?deckId= ได้)
export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const deckParam = searchParams.get("deckId");
  // deckId=none = เฉพาะคำที่ยังไม่จัดหมวด, ค่าอื่น = หมวดนั้น, ไม่ส่ง = ทั้งหมด
  const deckFilter =
    deckParam === "none"
      ? { deckId: null }
      : deckParam
        ? { deckId: deckParam }
        : {};

  const vocabs = await prisma.vocab.findMany({
    where: { userId: session.user.id, ...deckFilter },
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
  const deckId = await resolveDeckId(session.user.id, body?.deckId);

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
        deckId,
      },
      create: {
        userId: session.user.id,
        word: data.word,
        translation: data.translation,
        partOfSpeech: data.partOfSpeech || null,
        pronunciation: data.pronunciation || null,
        examples: data.examples as unknown as Prisma.InputJsonValue,
        notes: data.notes || null,
        deckId,
      },
    });

    await touchStreak(session.user.id);

    return NextResponse.json(vocab, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "เกิดข้อผิดพลาด";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
