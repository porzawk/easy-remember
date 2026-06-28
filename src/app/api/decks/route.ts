import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

// GET /api/decks — รายการหมวดของผู้ใช้ พร้อมจำนวนคำในแต่ละหมวด
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const decks = await prisma.deck.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "asc" },
    include: { _count: { select: { vocabs: true } } },
  });

  return NextResponse.json(
    decks.map((d) => ({
      id: d.id,
      name: d.name,
      emoji: d.emoji,
      count: d._count.vocabs,
    })),
  );
}

// POST /api/decks — สร้างหมวดใหม่ { name, emoji? }
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const name = String(body?.name ?? "").trim();
  const emoji = String(body?.emoji ?? "").trim() || null;
  if (!name) {
    return NextResponse.json({ error: "กรุณากรอกชื่อหมวด" }, { status: 400 });
  }

  // กันชื่อซ้ำของผู้ใช้คนเดิม (@@unique([userId, name]))
  const exists = await prisma.deck.findUnique({
    where: { userId_name: { userId: session.user.id, name } },
  });
  if (exists) {
    return NextResponse.json({ error: "มีหมวดชื่อนี้อยู่แล้ว" }, { status: 409 });
  }

  const deck = await prisma.deck.create({
    data: { userId: session.user.id, name, emoji },
  });

  return NextResponse.json(
    { id: deck.id, name: deck.name, emoji: deck.emoji, count: 0 },
    { status: 201 },
  );
}
