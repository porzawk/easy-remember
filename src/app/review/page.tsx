"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { SpeakButton } from "@/components/SpeakButton";

type Example = { en: string; th: string };
type Deck = { id: string; name: string; emoji: string | null; count: number };
type Vocab = {
  id: string;
  word: string;
  translation: string;
  partOfSpeech: string | null;
  pronunciation: string | null;
  examples: Example[];
  notes: string | null;
  reviewCount: number;
};

type Rating = "again" | "good" | "easy";

export default function ReviewPage() {
  const [queue, setQueue] = useState<Vocab[] | null>(null);
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [done, setDone] = useState(0);
  const [decks, setDecks] = useState<Deck[]>([]);
  const [deck, setDeck] = useState<string>(""); // "" = ทุกหมวด, "none" = ยังไม่จัดหมวด, อื่น = หมวดนั้น

  useEffect(() => {
    fetch("/api/decks")
      .then((r) => r.json())
      .then((data: Deck[]) => Array.isArray(data) && setDecks(data))
      .catch(() => {});
  }, []);

  // โหลดคิวใหม่ทุกครั้งที่เปลี่ยนหมวด
  useEffect(() => {
    setQueue(null);
    setIndex(0);
    setRevealed(false);
    setDone(0);
    const qs = deck ? `?deckId=${deck}` : "";
    fetch(`/api/review${qs}`)
      .then((r) => r.json())
      .then((data: Vocab[]) => setQueue(data))
      .catch(() => setQueue([]));
  }, [deck]);

  const deckTabs = [
    { key: "", label: "ทุกหมวด", emoji: "📚" },
    ...decks
      .filter((d) => d.count > 0)
      .map((d) => ({ key: d.id, label: d.name, emoji: d.emoji ?? "📁" })),
  ];

  // แถบเลือกหมวด (โชว์เฉพาะเมื่อมีหมวดให้เลือกมากกว่า "ทุกหมวด")
  const deckSelector =
    deckTabs.length > 1 ? (
      <div className="flex gap-2 overflow-x-auto pb-1">
        {deckTabs.map((t) => (
          <button
            key={t.key || "all"}
            onClick={() => setDeck(t.key)}
            className={`whitespace-nowrap rounded-full border px-3 py-1.5 text-sm ${
              deck === t.key
                ? "border-emerald-400 bg-emerald-500/20 text-emerald-200"
                : "border-white/15 text-white/70 hover:bg-white/10"
            }`}
          >
            {t.emoji} {t.label}
          </button>
        ))}
      </div>
    ) : null;

  if (queue === null) {
    return (
      <div className="space-y-6">
        {deckSelector}
        <p className="text-white/60">กำลังโหลด...</p>
      </div>
    );
  }

  const total = queue.length;
  const current = queue[index];

  if (!current) {
    return (
      <div className="space-y-6">
        {deckSelector}
        <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 text-center">
          <p className="text-5xl">🎉</p>
          <h1 className="text-2xl font-bold">
            {done > 0 ? `ทบทวนครบ ${done} ครั้งแล้ว!` : "ไม่มีคำที่ต้องทบทวนในหมวดนี้"}
          </h1>
          <p className="text-white/60">เยี่ยมมาก เลือกหมวดอื่น หรือกลับมาใหม่วันถัดไปได้เลย</p>
          <Link
            href="/"
            className="rounded-lg bg-emerald-500 px-5 py-2 font-medium hover:bg-emerald-400"
          >
            กลับหน้าหลัก
          </Link>
        </div>
      </div>
    );
  }

  // ประโยคแรกใช้เป็น guide (โชว์เฉพาะอังกฤษ ไม่โชว์คำแปล จะได้ไม่เฉลยไปก่อน)
  const guide = current.examples?.[0];

  async function rate(rating: Rating) {
    const card = current;
    fetch("/api/review", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: card.id, rating }),
    }).catch(() => {});

    setDone((d) => d + 1);
    setRevealed(false);

    if (rating === "again") {
      // นึกไม่ออก: เอาคำนี้ไปต่อท้ายคิว เพื่อทวนซ้ำอีกครั้งในรอบนี้
      setQueue((q) => {
        if (!q) return q;
        const rest = q.slice(index + 1);
        return [...q.slice(0, index), ...rest, card];
      });
      // ถ้ายังมีคำถัดไป index คงเดิม (คำถัดมาขยับเข้ามาแทน), ถ้าหมดแล้วค่อยไปเจอ card ที่ต่อท้าย
      setIndex((i) => i);
    } else {
      setIndex((i) => i + 1);
    }
  }

  return (
    <div className="space-y-6">
      {deckSelector}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">ทบทวนคำศัพท์</h1>
        <span className="text-sm text-white/60">เหลือ {total - index} คำ</span>
      </div>

      <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
        <div
          className="h-full bg-emerald-500 transition-all"
          style={{ width: `${total > 0 ? (index / total) * 100 : 0}%` }}
        />
      </div>

      <div className="min-h-[18rem] rounded-2xl border border-white/10 bg-white/5 p-8 text-center">
        <p className="mb-4 text-xs uppercase tracking-wide text-white/40">
          คำนี้แปลว่าอะไร?
        </p>

        <div className="flex items-center justify-center gap-3">
          <p className="text-3xl font-bold">{current.word}</p>
          <SpeakButton text={current.word} label={`ฟังเสียงคำว่า ${current.word}`} size="md" />
        </div>

        {current.pronunciation && (
          <p className="mt-1 text-emerald-300">/{current.pronunciation}/</p>
        )}

        {guide && (
          <div className="mx-auto mt-5 max-w-md rounded-lg border border-white/10 bg-black/20 p-3">
            <p className="mb-1 text-[11px] uppercase tracking-wide text-white/40">ประโยคใบ้</p>
            <div className="flex items-start gap-2 text-left">
              <p className="flex-1">{guide.en}</p>
              <SpeakButton text={guide.en} label="ฟังเสียงประโยคนี้" />
            </div>
          </div>
        )}

        {!revealed ? (
          <button
            onClick={() => setRevealed(true)}
            className="mt-10 rounded-lg bg-emerald-500 px-6 py-3 font-medium hover:bg-emerald-400"
          >
            ดูเฉลย
          </button>
        ) : (
          <div className="mt-6 space-y-4 text-left">
            <p className="text-center text-xl">{current.translation}</p>

            {current.examples?.length > 0 && (
              <ul className="space-y-2">
                {current.examples.map((ex, i) => (
                  <li key={i} className="rounded-lg bg-black/20 p-3">
                    <div className="flex items-start gap-2">
                      <p className="flex-1">{ex.en}</p>
                      <SpeakButton text={ex.en} label="ฟังเสียงประโยคนี้" />
                    </div>
                    <p className="text-sm text-white/60">{ex.th}</p>
                  </li>
                ))}
              </ul>
            )}

            {current.notes && (
              <p className="text-sm text-white/70">{current.notes}</p>
            )}
          </div>
        )}
      </div>

      {revealed && (
        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={() => rate("again")}
            className="rounded-lg bg-red-500/90 px-4 py-3 font-medium text-white hover:bg-red-500"
          >
            ลืม 😵
            <span className="block text-xs font-normal text-white/70">ทวนซ้ำ</span>
          </button>
          <button
            onClick={() => rate("good")}
            className="rounded-lg bg-emerald-500 px-4 py-3 font-medium text-black hover:bg-emerald-400"
          >
            จำได้ 🙂
            <span className="block text-xs font-normal text-black/60">อีกไม่กี่วัน</span>
          </button>
          <button
            onClick={() => rate("easy")}
            className="rounded-lg bg-sky-400 px-4 py-3 font-medium text-black hover:bg-sky-300"
          >
            ง่ายมาก 😎
            <span className="block text-xs font-normal text-black/60">เว้นนานขึ้น</span>
          </button>
        </div>
      )}
    </div>
  );
}
