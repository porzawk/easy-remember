"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function DeleteVocabButton({ id }: { id: string }) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    if (!confirm("ต้องการลบคำศัพท์นี้ใช่ไหม?")) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/vocab/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      router.push("/words");
      router.refresh();
    } catch {
      alert("ลบไม่สำเร็จ ลองใหม่อีกครั้ง");
      setDeleting(false);
    }
  }

  return (
    <button
      onClick={handleDelete}
      disabled={deleting}
      className="rounded-lg border border-red-400/30 px-4 py-2 text-sm text-red-300 hover:bg-red-400/10 disabled:opacity-50"
    >
      {deleting ? "กำลังลบ..." : "ลบคำนี้"}
    </button>
  );
}
