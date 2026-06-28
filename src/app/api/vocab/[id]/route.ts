import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

// PATCH /api/vocab/[id] — ย้ายคำไปหมวดอื่น { deckId: string | null }
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const rawDeck = String(body?.deckId ?? "").trim();

  // ตรวจว่าหมวดปลายทางเป็นของผู้ใช้ (ว่าง = เอาออกจากหมวด)
  let deckId: string | null = null;
  if (rawDeck) {
    const owned = await prisma.deck.findFirst({
      where: { id: rawDeck, userId: session.user.id },
      select: { id: true },
    });
    if (!owned) {
      return NextResponse.json({ error: "ไม่พบหมวด" }, { status: 400 });
    }
    deckId = rawDeck;
  }

  const result = await prisma.vocab.updateMany({
    where: { id, userId: session.user.id },
    data: { deckId },
  });

  if (result.count === 0) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
  return NextResponse.json({ ok: true, deckId });
}

// DELETE /api/vocab/[id] — ลบคำศัพท์ (เฉพาะของเจ้าของ)
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const result = await prisma.vocab.deleteMany({
    where: { id, userId: session.user.id },
  });

  if (result.count === 0) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
