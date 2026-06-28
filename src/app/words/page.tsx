import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { SpeakButton } from "@/components/SpeakButton";
import { DeckPicker } from "@/components/DeckPicker";

export default async function WordsPage({
  searchParams,
}: {
  searchParams: Promise<{ deck?: string }>;
}) {
  const session = await auth();
  const userId = session!.user.id;
  const { deck } = await searchParams;

  // deck=none = ยังไม่จัดหมวด, ค่าอื่น = หมวดนั้น, ไม่ส่ง = ทั้งหมด
  const deckFilter =
    deck === "none" ? { deckId: null } : deck ? { deckId: deck } : {};

  const [vocabs, decks, noneCount] = await Promise.all([
    prisma.vocab.findMany({
      where: { userId, ...deckFilter },
      orderBy: { createdAt: "desc" },
      include: { deck: { select: { name: true, emoji: true } } },
    }),
    prisma.deck.findMany({
      where: { userId },
      orderBy: { createdAt: "asc" },
      include: { _count: { select: { vocabs: true } } },
    }),
    prisma.vocab.count({ where: { userId, deckId: null } }),
  ]);

  const deckOptions = decks.map((d) => ({
    id: d.id,
    name: d.name,
    emoji: d.emoji,
  }));

  const tabs = [
    { key: "", label: "ทั้งหมด", emoji: "📚" },
    ...decks.map((d) => ({
      key: d.id,
      label: `${d.name} (${d._count.vocabs})`,
      emoji: d.emoji ?? "📁",
    })),
    ...(noneCount > 0
      ? [{ key: "none", label: `ยังไม่จัดหมวด (${noneCount})`, emoji: "🗂️" }]
      : []),
  ];

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

      {/* แท็บกรองตามหมวด */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {tabs.map((t) => {
          const active = (deck ?? "") === t.key;
          return (
            <Link
              key={t.key || "all"}
              href={t.key ? `/words?deck=${t.key}` : "/words"}
              className={`whitespace-nowrap rounded-full border px-3 py-1.5 text-sm ${
                active
                  ? "border-emerald-400 bg-emerald-500/20 text-emerald-200"
                  : "border-white/15 text-white/70 hover:bg-white/10"
              }`}
            >
              {t.emoji} {t.label}
            </Link>
          );
        })}
      </div>

      {vocabs.length === 0 ? (
        <div className="rounded-xl border border-white/10 bg-white/5 p-8 text-center text-white/60">
          ยังไม่มีคำศัพท์ในหมวดนี้ —{" "}
          <Link href="/vocab" className="text-emerald-300 underline">
            เริ่มเพิ่มคำ
          </Link>
        </div>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {vocabs.map((v) => (
            <li
              key={v.id}
              className="relative flex flex-col rounded-xl border border-white/10 bg-white/5 hover:border-emerald-400/50"
            >
              <Link
                href={`/vocab/${v.id}`}
                className="block rounded-t-xl p-4 hover:bg-white/10"
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
              {/* เปลี่ยนหมวดได้เลยจากตรงนี้ (อยู่นอก Link จึงไม่เด้งเข้าหน้ารายละเอียด) */}
              <div className="mt-auto border-t border-white/10 px-4 py-2">
                <DeckPicker vocabId={v.id} currentDeckId={v.deckId} decks={deckOptions} />
              </div>
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
