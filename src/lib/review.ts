import { prisma } from "@/lib/prisma";
import type { Vocab } from "@prisma/client";

const DAY = 24 * 60 * 60 * 1000;

// กติกาทบทวน (spaced repetition):
// - แสดงคำที่เพิ่มมาเกิน 3 วัน
// - ถ้าทบทวนครบ 10 ครั้งแล้ว ไม่ต้องแสดงอีก
// - คำอายุ 3 วัน - 1 เดือน: ทบทวนได้วันละครั้ง
// - คำอายุเกิน 1 เดือน: ทบทวนเดือนละครั้ง
export async function getDueVocabs(userId: string): Promise<Vocab[]> {
  const now = Date.now();
  const threeDaysAgo = new Date(now - 3 * DAY);

  const candidates = await prisma.vocab.findMany({
    where: {
      userId,
      reviewCount: { lt: 10 },
      createdAt: { lte: threeDaysAgo },
    },
    orderBy: { lastReviewedAt: { sort: "asc", nulls: "first" } },
  });

  return candidates.filter((v) => isDue(v, now));
}

export function isDue(v: Vocab, now: number = Date.now()): boolean {
  if (v.reviewCount >= 10) return false;

  const ageMs = now - v.createdAt.getTime();
  if (ageMs < 3 * DAY) return false;

  const olderThanMonth = ageMs >= 30 * DAY;
  const cadence = olderThanMonth ? 30 * DAY : 1 * DAY;

  if (!v.lastReviewedAt) return true;
  return now - v.lastReviewedAt.getTime() >= cadence;
}
