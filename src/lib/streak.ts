import { prisma } from "@/lib/prisma";

const DAY = 24 * 60 * 60 * 1000;

// ตัดเวลาให้เหลือแค่วัน (เที่ยงคืนตามเวลาเครื่อง server) เพื่อเทียบว่าเป็น "วันเดียวกัน" ไหม
export function startOfDay(d: Date | number = Date.now()): Date {
  const date = new Date(d);
  date.setHours(0, 0, 0, 0);
  return date;
}

export type StreakInfo = {
  streakCount: number;
  longestStreak: number;
  dailyGoal: number;
  /** จำนวนกิจกรรม (ทบทวน/เพิ่มคำ) ของวันนี้ */
  todayCount: number;
};

// เรียกทุกครั้งที่ผู้ใช้ทำกิจกรรม (เพิ่มคำ / ทบทวน) เพื่ออัปเดต streak แบบกันลืม
// - กิจกรรมวันเดียวกัน: streak คงเดิม
// - กิจกรรมต่อจากเมื่อวาน: streak +1
// - เว้นไปเกิน 1 วัน: streak รีเซ็ตเป็น 1
export async function touchStreak(userId: string): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { streakCount: true, longestStreak: true, lastActiveOn: true },
  });
  if (!user) return;

  const today = startOfDay();
  const last = user.lastActiveOn ? startOfDay(user.lastActiveOn) : null;

  // ทำกิจกรรมไปแล้ววันนี้ ไม่ต้องอัปเดตอะไร
  if (last && last.getTime() === today.getTime()) return;

  const continued = last && today.getTime() - last.getTime() === DAY;
  const streakCount = continued ? user.streakCount + 1 : 1;
  const longestStreak = Math.max(user.longestStreak, streakCount);

  await prisma.user.update({
    where: { id: userId },
    data: { streakCount, longestStreak, lastActiveOn: today },
  });
}

// อ่านข้อมูล streak + จำนวนกิจกรรมวันนี้ (ไว้โชว์ความคืบหน้าเป้าหมายรายวัน)
export async function getStreakInfo(userId: string): Promise<StreakInfo> {
  const today = startOfDay();

  const [user, todayCount] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { streakCount: true, longestStreak: true, dailyGoal: true, lastActiveOn: true },
    }),
    // นับคำที่ถูกทบทวนวันนี้ (lastReviewedAt) + คำที่เพิ่มวันนี้ (createdAt)
    prisma.vocab.count({
      where: {
        userId,
        OR: [{ lastReviewedAt: { gte: today } }, { createdAt: { gte: today } }],
      },
    }),
  ]);

  // ถ้าวันนี้ยังไม่ได้ทำอะไร และกิจกรรมล่าสุดไม่ใช่เมื่อวาน ให้ถือว่า streak ขาดแล้ว (โชว์ 0)
  const last = user?.lastActiveOn ? startOfDay(user.lastActiveOn) : null;
  const brokenStreak =
    last !== null &&
    today.getTime() - last.getTime() > DAY;

  return {
    streakCount: brokenStreak ? 0 : user?.streakCount ?? 0,
    longestStreak: user?.longestStreak ?? 0,
    dailyGoal: user?.dailyGoal ?? 5,
    todayCount,
  };
}
