import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { SpeakButton } from "@/components/SpeakButton";

export default async function WordsPage() {
  const session = await auth();

  const vocabs = await prisma.vocab.findMany({
    where: { userId: session!.user.id },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">คลังคำศัพท์</h1>
          <p className="text-white/70">ทั้งหมด {vocabs.length} คำ — กดเพื่อดูรายละเอียด</p>
        </div>
        <Link
          href="/vocab"
          className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-medium hover:bg-emerald-400"
        >
          + เพิ่มคำศัพท์
        </Link>
      </div>

      {vocabs.length === 0 ? (
        <div className="rounded-xl border border-white/10 bg-white/5 p-8 text-center text-white/60">
          ยังไม่มีคำศัพท์ —{" "}
          <Link href="/vocab" className="text-emerald-300 underline">
            เริ่มเพิ่มคำแรก
          </Link>
        </div>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {vocabs.map((v) => (
            <li key={v.id} className="relative">
              <Link
                href={`/vocab/${v.id}`}
                className="block h-full rounded-xl border border-white/10 bg-white/5 p-4 hover:border-emerald-400/50 hover:bg-white/10"
              >
                <div className="flex items-baseline justify-between gap-2 pr-9">
                  <p className="font-medium">
                    {v.word}{" "}
                    {v.partOfSpeech && (
                      <span className="text-xs text-white/50">({v.partOfSpeech})</span>
                    )}
                  </p>
                  <span className="shrink-0 text-xs text-white/40">
                    ทบทวน {v.reviewCount}×
                  </span>
                </div>
                <p className="mt-1 text-sm text-white/70">{v.translation}</p>
              </Link>
              <SpeakButton
                text={v.word}
                label={`ฟังเสียงคำว่า ${v.word}`}
                className="absolute right-3 top-3"
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
