import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { generateVocab } from "@/lib/ai";

// สร้างคำแปล/ประโยคตัวอย่างจาก Z.ai (ยังไม่บันทึก — ใช้ดู preview ก่อน)
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const word = String(body?.word ?? "").trim();
  if (!word) {
    return NextResponse.json({ error: "กรุณากรอกคำศัพท์" }, { status: 400 });
  }

  try {
    const result = await generateVocab(word);
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "เกิดข้อผิดพลาด";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
