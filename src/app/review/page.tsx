"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { SpeakButton } from "@/components/SpeakButton";

type Example = { en: string; th: string };
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

export default function ReviewPage() {
  const [queue, setQueue] = useState<Vocab[] | null>(null);
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [done, setDone] = useState(0);

  useEffect(() => {
    fetch("/api/review")
      .then((r) => r.json())
      .then((data: Vocab[]) => setQueue(data))
      .catch(() => setQueue([]));
  }, []);

  if (queue === null) {
    return <p className="text-white/60">กำลังโหลด...</p>;
  }

  const total = queue.length;
  const current = queue[index];

  if (!current) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
        <p className="text-5xl">🎉</p>
        <h1 className="text-2xl font-bold">
          {done > 0 ? `ทบทวนครบ ${done} คำแล้ว!` : "ไม่มีคำที่ต้องทบทวนตอนนี้"}
        </h1>
        <p className="text-white/60">เยี่ยมมาก กลับมาทบทวนใหม่ในวันถัดไปได้เลย</p>
        <Link
          href="/"
          className="rounded-lg bg-emerald-500 px-5 py-2 font-medium hover:bg-emerald-400"
        >
          กลับหน้าหลัก
        </Link>
      </div>
    );
  }

  async function markReviewed() {
    await fetch("/api/review", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: current.id }),
    }).catch(() => {});
    setDone((d) => d + 1);
    setRevealed(false);
    setIndex((i) => i + 1);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">ทบทวนคำศัพท์</h1>
        <span className="text-sm text-white/60">
          {index + 1} / {total}
        </span>
      </div>

      <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
        <div
          className="h-full bg-emerald-500 transition-all"
          style={{ width: `${(index / total) * 100}%` }}
        />
      </div>

      <div className="min-h-[18rem] rounded-2xl border border-white/10 bg-white/5 p-8 text-center">
        <div className="flex items-center justify-center gap-3">
          <p className="text-3xl font-bold">{current.word}</p>
          <SpeakButton text={current.word} label={`ฟังเสียงคำว่า ${current.word}`} size="md" />
        </div>
        {current.pronunciation && (
          <p className="mt-1 text-emerald-300">/{current.pronunciation}/</p>
        )}

        {!revealed ? (
          <button
            onClick={() => setRevealed(true)}
            className="mt-10 rounded-lg bg-emerald-500 px-6 py-3 font-medium hover:bg-emerald-400"
          >
            เฉลยคำแปล
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
        <button
          onClick={markReviewed}
          className="w-full rounded-lg bg-green-500 px-5 py-3 font-medium text-black hover:bg-green-400"
        >
          จำได้แล้ว ทบทวนคำถัดไป →
        </button>
      )}
    </div>
  );
}
