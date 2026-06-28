"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export type Deck = { id: string; name: string; emoji: string | null; count: number };

export function DeckManager({ initialDecks }: { initialDecks: Deck[] }) {
  const router = useRouter();
  const [decks, setDecks] = useState<Deck[]>(initialDecks);
  const [name, setName] = useState("");
  const [emoji, setEmoji] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/decks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), emoji: emoji.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "สร้างไม่สำเร็จ");
      setDecks((d) => [...d, data]);
      setName("");
      setEmoji("");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "สร้างไม่สำเร็จ");
    } finally {
      setBusy(false);
    }
  }

  async function rename(deck: Deck) {
    const next = window.prompt("ชื่อหมวดใหม่", deck.name);
    if (next === null) return;
    const trimmed = next.trim();
    if (!trimmed || trimmed === deck.name) return;
    const res = await fetch(`/api/decks/${deck.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: trimmed }),
    });
    if (res.ok) {
      setDecks((d) => d.map((x) => (x.id === deck.id ? { ...x, name: trimmed } : x)));
      router.refresh();
    } else {
      const data = await res.json().catch(() => ({}));
      alert(data.error ?? "เปลี่ยนชื่อไม่สำเร็จ");
    }
  }

  async function remove(deck: Deck) {
    if (
      !window.confirm(
        `ลบหมวด "${deck.name}"? คำศัพท์ ${deck.count} คำจะไม่ถูกลบ แต่จะหลุดออกจากหมวด`,
      )
    )
      return;
    const res = await fetch(`/api/decks/${deck.id}`, { method: "DELETE" });
    if (res.ok) {
      setDecks((d) => d.filter((x) => x.id !== deck.id));
      router.refresh();
    }
  }

  return (
    <div className="space-y-6">
      <form
        onSubmit={create}
        className="flex flex-wrap items-end gap-2 rounded-xl border border-white/10 bg-white/5 p-4"
      >
        <label className="flex flex-col gap-1">
          <span className="text-xs text-white/50">ไอคอน</span>
          <input
            value={emoji}
            onChange={(e) => setEmoji(e.target.value)}
            placeholder="🎮"
            maxLength={2}
            className="w-16 rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-center outline-none focus:border-emerald-400"
          />
        </label>
        <label className="flex flex-1 flex-col gap-1">
          <span className="text-xs text-white/50">ชื่อหมวด</span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="เช่น เกม, หนัง, คำใช้บ่อย"
            className="w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 outline-none focus:border-emerald-400"
          />
        </label>
        <button
          type="submit"
          disabled={busy || !name.trim()}
          className="rounded-lg bg-emerald-500 px-5 py-2 font-medium hover:bg-emerald-400 disabled:opacity-50"
        >
          + เพิ่มหมวด
        </button>
      </form>

      {error && (
        <p className="rounded-lg border border-red-400/30 bg-red-400/10 px-4 py-3 text-red-300">
          {error}
        </p>
      )}

      {decks.length === 0 ? (
        <p className="rounded-xl border border-white/10 bg-white/5 p-8 text-center text-white/60">
          ยังไม่มีหมวด — สร้างหมวดแรกด้านบนได้เลย
        </p>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {decks.map((d) => (
            <li
              key={d.id}
              className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 p-4"
            >
              <Link
                href={`/words?deck=${d.id}`}
                className="flex items-center gap-3 hover:text-emerald-300"
              >
                <span className="text-2xl">{d.emoji ?? "📁"}</span>
                <span>
                  <span className="block font-medium">{d.name}</span>
                  <span className="block text-xs text-white/50">{d.count} คำ</span>
                </span>
              </Link>
              <div className="flex gap-2 text-sm">
                <button
                  onClick={() => rename(d)}
                  className="rounded-md border border-white/15 px-3 py-1 text-white/80 hover:bg-white/10"
                >
                  แก้ชื่อ
                </button>
                <button
                  onClick={() => remove(d)}
                  className="rounded-md border border-red-400/30 px-3 py-1 text-red-300 hover:bg-red-400/10"
                >
                  ลบ
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
