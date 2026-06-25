import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getDueVocabs, schedule, type Rating } from "@/lib/review";
import { touchStreak } from "@/lib/streak";

const RATINGS: Rating[] = ["again", "good", "easy"];

// GET /api/review — คำที่ถึงกำหนดทบทวน
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const due = await getDueVocabs(session.user.id);
  return NextResponse.json(due);
}

// POST /api/review — บันทึกผลทบทวนคำนี้ { id, rating: "again" | "good" | "easy" }
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const id = String(body?.id ?? "");
  const rating = String(body?.rating ?? "good") as Rating;
  if (!id) {
    return NextResponse.json({ error: "missing id" }, { status: 400 });
  }
  if (!RATINGS.includes(rating)) {
    return NextResponse.json({ error: "invalid rating" }, { status: 400 });
  }

  const vocab = await prisma.vocab.findFirst({
    where: { id, userId: session.user.id },
    select: { easeFactor: true, interval: true, repetitions: true },
  });
  if (!vocab) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  const next = schedule(vocab, rating);

  await prisma.vocab.update({
    where: { id },
    data: {
      easeFactor: next.easeFactor,
      interval: next.interval,
      repetitions: next.repetitions,
      dueAt: next.dueAt,
      reviewCount: { increment: 1 },
      lastReviewedAt: new Date(),
    },
  });

  await touchStreak(session.user.id);

  return NextResponse.json({ ok: true, dueAt: next.dueAt, interval: next.interval });
}
