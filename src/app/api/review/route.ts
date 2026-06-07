import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getDueVocabs } from "@/lib/review";

// GET /api/review — คำที่ถึงกำหนดทบทวน
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const due = await getDueVocabs(session.user.id);
  return NextResponse.json(due);
}

// POST /api/review — บันทึกว่าทบทวนคำนี้แล้ว { id }
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const id = String(body?.id ?? "");
  if (!id) {
    return NextResponse.json({ error: "missing id" }, { status: 400 });
  }

  const result = await prisma.vocab.updateMany({
    where: { id, userId: session.user.id },
    data: {
      reviewCount: { increment: 1 },
      lastReviewedAt: new Date(),
    },
  });

  if (result.count === 0) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
