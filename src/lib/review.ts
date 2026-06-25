import { prisma } from "@/lib/prisma";
import type { Vocab } from "@prisma/client";

const DAY = 24 * 60 * 60 * 1000;

// คะแนนที่ผู้ใช้ให้ตัวเองตอนทบทวน (active recall)
export type Rating = "again" | "good" | "easy";

// แปลงเป็นค่า quality ของ SM-2 (0-5)
const QUALITY: Record<Rating, number> = {
  again: 2, // นึกไม่ออก / ผิด -> รีเซ็ต
  good: 4, // นึกออก
  easy: 5, // ง่ายมาก
};

// คำที่ถึงกำหนดทบทวน: dueAt <= ตอนนี้ (คำใหม่ dueAt = ตอนสร้าง จึงเข้าคิวทันที)
// เรียงจากที่ค้างนานสุดก่อน เพื่อกันลืมคำเก่า
export async function getDueVocabs(userId: string): Promise<Vocab[]> {
  return prisma.vocab.findMany({
    where: { userId, dueAt: { lte: new Date() } },
    orderBy: { dueAt: "asc" },
  });
}

export async function countDueVocabs(userId: string): Promise<number> {
  return prisma.vocab.count({
    where: { userId, dueAt: { lte: new Date() } },
  });
}

export type Schedule = {
  easeFactor: number;
  interval: number;
  repetitions: number;
  dueAt: Date;
};

// อัลกอริทึม SM-2 (SuperMemo 2) — คำนวณรอบทบทวนถัดไปจากคะแนนที่ผู้ใช้ให้
// ตอบถูก -> ระยะห่างขยายขึ้นเรื่อย ๆ (1, 6, x ease, ...) ทำให้ทบทวนถี่ตอนแรกแล้วค่อยห่างออก
// ตอบผิด -> รีเซ็ตให้กลับมาทบทวนใหม่พรุ่งนี้
export function schedule(
  v: Pick<Vocab, "easeFactor" | "interval" | "repetitions">,
  rating: Rating,
  now: number = Date.now(),
): Schedule {
  const q = QUALITY[rating];
  let { easeFactor, interval, repetitions } = v;

  if (q < 3) {
    repetitions = 0;
    interval = 1; // กลับมาทบทวนพรุ่งนี้
  } else {
    if (repetitions === 0) interval = 1;
    else if (repetitions === 1) interval = 6;
    else interval = Math.round(interval * easeFactor);
    repetitions += 1;
  }

  // ปรับ ease factor ตามคะแนน (ต่ำสุด 1.3)
  easeFactor = Math.max(
    1.3,
    easeFactor + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02)),
  );

  return {
    easeFactor,
    interval,
    repetitions,
    dueAt: new Date(now + interval * DAY),
  };
}
