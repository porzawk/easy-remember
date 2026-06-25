import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { checkSentence } from "@/lib/ai";

// POST /api/practice — ตรวจประโยคที่ผู้เรียนแต่งเอง { word, sentence }
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const word = String(body?.word ?? "").trim();
  const sentence = String(body?.sentence ?? "").trim();
  if (!word || !sentence) {
    return NextResponse.json({ error: "กรุณากรอกประโยค" }, { status: 400 });
  }

  try {
    const result = await checkSentence(word, sentence);
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "เกิดข้อผิดพลาด";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
