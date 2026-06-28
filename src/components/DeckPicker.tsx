"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Deck = { id: string; name: string; emoji: string | null };

export function DeckPicker({
  vocabId,
  currentDeckId,
  decks,
}: {
  vocabId: string;
  currentDeckId: string | null;
  decks: Deck[];
}) {
  const router = useRouter();
  const [deckId, setDeckId] = useState(currentDeckId ?? "");
  const [saving, setSaving] = useState(false);

  async function change(next: string) {
    const prev = deckId;
    setDeckId(next);
    setSaving(true);
    try {
      const res = await fetch(`/api/vocab/${vocabId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deckId: next || null }),
      });
      if (!res.ok) throw new Error();
      router.refresh();
    } catch {
      setDeckId(prev); // ย้อนกลับถ้าพลาด
    } finally {
      setSaving(false);
    }
  }

  return (
    <label className="flex items-center gap-2 text-sm">
      <span className="text-white/50">หมวด:</span>
      <select
        value={deckId}
        disabled={saving}
        onChange={(e) => change(e.target.value)}
        className="rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 outline-none focus:border-emerald-400 disabled:opacity-50"
      >
        <option value="">— ไม่จัดหมวด —</option>
        {decks.map((d) => (
          <option key={d.id} value={d.id}>
            {d.emoji ? `${d.emoji} ` : ""}
            {d.name}
          </option>
        ))}
      </select>
    </label>
  );
}
