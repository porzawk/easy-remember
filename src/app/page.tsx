import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { countDueVocabs } from "@/lib/review";
import { getStreakInfo } from "@/lib/streak";

const DAY = 24 * 60 * 60 * 1000;

export default async function DashboardPage() {
  const session = await auth();
  const userId = session!.user.id;

  const now = Date.now();
  const startOfWeek = new Date(now - 7 * DAY);

  const [total, addedThisWeek, reviewAgg, recent, dueCount, streak] = await Promise.all([
    prisma.vocab.count({ where: { userId } }),
    prisma.vocab.count({ where: { userId, createdAt: { gte: startOfWeek } } }),
    prisma.vocab.aggregate({
      where: { userId },
      _sum: { reviewCount: true },
    }),
    prisma.vocab.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 8,
    }),
    countDueVocabs(userId),
    getStreakInfo(userId),
  ]);

  const totalReviews = reviewAgg._sum.reviewCount ?? 0;
  const goalReached = streak.todayCount >= streak.dailyGoal;
  const goalPct = Math.min(100, Math.round((streak.todayCount / streak.dailyGoal) * 100));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">สวัสดี {session!.user.name ?? ""} 👋</h1>
        <p className="text-white/70">สรุปการฝึกศัพท์ของคุณ</p>
      </div>

      {/* การ์ดเป้าหมายรายวัน + streak (สร้างนิสัยเข้ามาทุกวัน) */}
      <div className="rounded-2xl border border-white/10 bg-linear-to-br from-orange-500/15 to-amber-400/5 p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-white/60">ทำต่อเนื่อง</p>
            <p className="text-3xl font-bold">
              🔥 {streak.streakCount} <span className="text-base font-normal text-white/60">วัน</span>
            </p>
            {streak.longestStreak > 0 && (
              <p className="text-xs text-white/40">สถิติสูงสุด {streak.longestStreak} วัน</p>
            )}
          </div>
          <div className="text-right">
            <p className="text-sm text-white/60">เป้าหมายวันนี้</p>
            <p className="text-2xl font-bold">
              {streak.todayCount}
              <span className="text-base font-normal text-white/50"> / {streak.dailyGoal}</span>
            </p>
          </div>
        </div>
        <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full bg-orange-400 transition-all"
            style={{ width: `${goalPct}%` }}
          />
        </div>
        <p className="mt-2 text-sm text-white/70">
          {goalReached
            ? "ทำเป้าหมายวันนี้ครบแล้ว เก่งมาก! 🎉 กลับมาพรุ่งนี้เพื่อต่อ streak"
            : `อีก ${streak.dailyGoal - streak.todayCount} ครั้งจะครบเป้าวันนี้ — ทบทวนหรือเพิ่มคำใหม่ได้เลย`}
        </p>
      </div>

      {dueCount > 0 && (
        <Link
          href="/review"
          className="flex items-center justify-between rounded-xl border border-amber-400/30 bg-amber-400/10 px-5 py-4 hover:bg-amber-400/20"
        >
          <div>
            <p className="font-semibold text-amber-300">
              มีคำรอทบทวน {dueCount} คำ
            </p>
            <p className="text-sm text-white/70">ทบทวนตามรอบเพื่อกันลืม (spaced repetition)</p>
          </div>
          <span className="rounded-lg bg-amber-400 px-4 py-2 font-medium text-black">
            เริ่มทบทวน →
          </span>
        </Link>
      )}

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="คำศัพท์ทั้งหมด" value={total} />
        <StatCard label="เพิ่มสัปดาห์นี้" value={addedThisWeek} />
        <StatCard label="ทบทวนไปแล้ว" value={totalReviews} suffix="ครั้ง" />
        <StatCard label="รอทบทวน" value={dueCount} highlight={dueCount > 0} />
      </div>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">คำศัพท์ล่าสุด</h2>
          <Link href="/words" className="text-sm text-emerald-300 hover:text-emerald-200">
            ดูทั้งหมด →
          </Link>
        </div>

        {recent.length === 0 ? (
          <div className="rounded-xl border border-white/10 bg-white/5 p-8 text-center text-white/60">
            ยังไม่มีคำศัพท์ —{" "}
            <Link href="/vocab" className="text-emerald-300 underline">
              เริ่มเพิ่มคำแรก
            </Link>
          </div>
        ) : (
          <ul className="divide-y divide-white/10 overflow-hidden rounded-xl border border-white/10 bg-white/5">
            {recent.map((v) => (
              <li key={v.id}>
                <Link
                  href={`/vocab/${v.id}`}
                  className="flex items-center justify-between px-4 py-3 hover:bg-white/5"
                >
                  <div>
                    <p className="font-medium">
                      {v.word}{" "}
                      {v.partOfSpeech && (
                        <span className="text-xs text-white/50">({v.partOfSpeech})</span>
                      )}
                    </p>
                    <p className="text-sm text-white/70">{v.translation}</p>
                  </div>
                  <span className="text-xs text-white/40">
                    ทบทวน {v.reviewCount} ครั้ง
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function StatCard({
  label,
  value,
  suffix,
  highlight,
}: {
  label: string;
  value: number;
  suffix?: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-xl border p-4 ${
        highlight
          ? "border-amber-400/40 bg-amber-400/10"
          : "border-white/10 bg-white/5"
      }`}
    >
      <p className="text-sm text-white/60">{label}</p>
      <p className="mt-1 text-2xl font-bold">
        {value}
        {suffix && <span className="ml-1 text-sm font-normal text-white/50">{suffix}</span>}
      </p>
    </div>
  );
}
