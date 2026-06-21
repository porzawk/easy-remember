"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { SpeakButton } from "@/components/SpeakButton";

type Example = { en: string; th: string };
type Generated = {
  word: string;
  translation: string;
  partOfSpeech: string;
  pronunciation: string;
  examples: Example[];
  notes: string;
};

export default function AddVocabPage() {
  const router = useRouter();
  const [word, setWord] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<Generated | null>(null);
  const [saved, setSaved] = useState<string | null>(null);

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault();
    if (!word.trim()) return;
    setLoading(true);
    setError(null);
    setPreview(null);
    setSaved(null);
    try {
      const res = await fetch("/api/vocab/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ word: word.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "เกิดข้อผิดพลาด");
      setPreview(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "เกิดข้อผิดพลาด");
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    if (!preview) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/vocab", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(preview),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "บันทึกไม่สำเร็จ");
      setSaved(preview.word);
      setPreview(null);
      setWord("");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "บันทึกไม่สำเร็จ");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">เพิ่มคำศัพท์</h1>
        <p className="text-white/70">
          พิมพ์คำที่อยากจำ แล้วให้ AI ช่วยสร้างคำแปลและประโยคตัวอย่าง
        </p>
      </div>

      <form onSubmit={handleGenerate} className="flex gap-2">
        <input
          value={word}
          onChange={(e) => setWord(e.target.value)}
          placeholder="เช่น improve, schedule, brave..."
          className="flex-1 rounded-lg border border-white/15 bg-white/5 px-4 py-3 outline-none focus:border-emerald-400"
        />
        <button
          type="submit"
          disabled={loading || !word.trim()}
          className="rounded-lg bg-emerald-500 px-5 py-3 font-medium hover:bg-emerald-400 disabled:opacity-50"
        >
          {loading ? "กำลังสร้าง..." : "สร้างด้วย AI"}
        </button>
      </form>

      {error && (
        <p className="rounded-lg border border-red-400/30 bg-red-400/10 px-4 py-3 text-red-300">
          {error}
        </p>
      )}

      {saved && (
        <p className="rounded-lg border border-green-400/30 bg-green-400/10 px-4 py-3 text-green-300">
          บันทึก &quot;{saved}&quot; เรียบร้อย ✓
        </p>
      )}

      {preview && (
        <div className="space-y-4 rounded-xl border border-white/10 bg-white/5 p-5">
          <div className="flex items-baseline gap-3">
            <h2 className="text-xl font-bold">{preview.word}</h2>
            <SpeakButton text={preview.word} label={`ฟังเสียงคำว่า ${preview.word}`} size="md" />
            {preview.partOfSpeech && (
              <span className="text-sm text-white/50">{preview.partOfSpeech}</span>
            )}
            {preview.pronunciation && (
              <span className="text-sm text-emerald-300">/{preview.pronunciation}/</span>
            )}
          </div>

          <p className="text-lg">{preview.translation}</p>

          {preview.examples?.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-semibold text-white/60">ประโยคตัวอย่าง</p>
              <ul className="space-y-2">
                {preview.examples.map((ex, i) => (
                  <li key={i} className="rounded-lg bg-black/20 p-3">
                    <div className="flex items-start gap-2">
                      <p className="flex-1">{ex.en}</p>
                      <SpeakButton text={ex.en} label="ฟังเสียงประโยคนี้" />
                    </div>
                    <p className="text-sm text-white/60">{ex.th}</p>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {preview.notes && (
            <div>
              <p className="text-sm font-semibold text-white/60">ควรรู้เพิ่มเติม</p>
              <p className="text-white/80">{preview.notes}</p>
            </div>
          )}

          <div className="flex gap-2 pt-2">
            <button
              onClick={handleSave}
              disabled={saving}
              className="rounded-lg bg-green-500 px-5 py-2 font-medium text-black hover:bg-green-400 disabled:opacity-50"
            >
              {saving ? "กำลังบันทึก..." : "บันทึกคำนี้"}
            </button>
            <button
              onClick={() => setPreview(null)}
              className="rounded-lg border border-white/15 px-5 py-2 hover:bg-white/10"
            >
              ยกเลิก
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
