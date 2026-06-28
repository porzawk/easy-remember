import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

// PATCH /api/decks/[id] — เปลี่ยนชื่อ/ไอคอนหมวด { name?, emoji? }
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

  const data: { name?: string; emoji?: string | null } = {};
  if (body?.name !== undefined) {
    const name = String(body.name).trim();
    if (!name) {
      return NextResponse.json({ error: "ชื่อหมวดห้ามว่าง" }, { status: 400 });
    }
    data.name = name;
  }
  if (body?.emoji !== undefined) {
    data.emoji = String(body.emoji).trim() || null;
  }

  // ยืนยันว่าหมวดเป็นของผู้ใช้คนนี้
  const owned = await prisma.deck.findFirst({
    where: { id, userId: session.user.id },
    select: { id: true },
  });
  if (!owned) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  try {
    const deck = await prisma.deck.update({ where: { id }, data });
    return NextResponse.json({ id: deck.id, name: deck.name, emoji: deck.emoji });
  } catch {
    // ชนกับ unique([userId, name])
    return NextResponse.json({ error: "มีหมวดชื่อนี้อยู่แล้ว" }, { status: 409 });
  }
}

// DELETE /api/decks/[id] — ลบหมวด (คำในหมวดไม่ถูกลบ แค่หลุดหมวด ผ่าน onDelete: SetNull)
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const result = await prisma.deck.deleteMany({
    where: { id, userId: session.user.id },
  });

  if (result.count === 0) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
