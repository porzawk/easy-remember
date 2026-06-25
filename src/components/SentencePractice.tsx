"use client";

import { useState } from "react";

type Result = {
  correct: boolean;
  corrected: string;
  feedback: string;
};

// ฝึก "ผลิต" ภาษา: ให้ผู้เรียนแต่งประโยคด้วยคำนี้เอง แล้ว AI ตรวจ+แก้ให้
// การแต่งเองช่วยให้ "นำไปใช้ได้จริง" มากกว่าแค่จำความหมาย
export function SentencePractice({ word }: { word: string }) {
  const [sentence, setSentence] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Result | null>(null);

  async function handleCheck(e: React.FormEvent) {
    e.preventDefault();
    if (!sentence.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/practice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ word, sentence: sentence.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "เกิดข้อผิดพลาด");
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "เกิดข้อผิดพลาด");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
      <h2 className="text-lg font-semibold">ฝึกแต่งประโยคเอง ✍️</h2>
      <p className="mt-1 text-sm text-white/60">
        ลองแต่งประโยคภาษาอังกฤษด้วยคำว่า <span className="text-emerald-300">{word}</span>{" "}
        แล้วให้ AI ช่วยตรวจ — ยิ่งลองใช้เอง ยิ่งจำและนำไปใช้ได้
      </p>

      <form onSubmit={handleCheck} className="mt-4 space-y-3">
        <textarea
          value={sentence}
          onChange={(e) => setSentence(e.target.value)}
          rows={2}
          placeholder={`เช่น I want to ${word.toLowerCase()} my English every day.`}
          className="w-full rounded-lg border border-white/15 bg-white/5 px-4 py-3 outline-none focus:border-emerald-400"
        />
        <button
          type="submit"
          disabled={loading || !sentence.trim()}
          className="rounded-lg bg-emerald-500 px-5 py-2 font-medium hover:bg-emerald-400 disabled:opacity-50"
        >
          {loading ? "กำลังตรวจ..." : "ตรวจประโยค"}
        </button>
      </form>

      {error && (
        <p className="mt-3 rounded-lg border border-red-400/30 bg-red-400/10 px-4 py-3 text-red-300">
          {error}
        </p>
      )}

      {result && (
        <div
          className={`mt-4 space-y-2 rounded-lg border p-4 ${
            result.correct
              ? "border-green-400/30 bg-green-400/10"
              : "border-amber-400/30 bg-amber-400/10"
          }`}
        >
          <p className="font-semibold">
            {result.correct ? "เยี่ยม! ใช้ได้ ✓" : "เกือบแล้ว ลองปรับนิดนึง"}
          </p>
          {result.corrected && (
            <p>
              <span className="text-sm text-white/50">แบบที่เป็นธรรมชาติ: </span>
              {result.corrected}
            </p>
          )}
          {result.feedback && (
            <p className="text-sm text-white/70">{result.feedback}</p>
          )}
        </div>
      )}
    </div>
  );
}
