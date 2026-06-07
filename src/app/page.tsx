import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getDueVocabs } from "@/lib/review";

const DAY = 24 * 60 * 60 * 1000;

export default async function DashboardPage() {
  const session = await auth();
  const userId = session!.user.id;

  const now = Date.now();
  const startOfWeek = new Date(now - 7 * DAY);

  const [total, addedThisWeek, reviewAgg, recent, due] = await Promise.all([
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
    getDueVocabs(userId),
  ]);

  const totalReviews = reviewAgg._sum.reviewCount ?? 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">สวัสดี {session!.user.name ?? ""} 👋</h1>
        <p className="text-white/70">สรุปการฝึกศัพท์ของคุณ</p>
      </div>

      {due.length > 0 && (
        <Link
          href="/review"
          className="flex items-center justify-between rounded-xl border border-amber-400/30 bg-amber-400/10 px-5 py-4 hover:bg-amber-400/20"
        >
          <div>
            <p className="font-semibold text-amber-300">
              มีคำรอทบทวน {due.length} คำ
            </p>
            <p className="text-sm text-white/70">ทบทวนก่อนเริ่มใช้งานเพื่อกันลืม</p>
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
        <StatCard label="รอทบทวน" value={due.length} highlight={due.length > 0} />
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
