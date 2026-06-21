// AI integration (OpenAI-compatible Chat Completions API)
// default: Groq (ฟรี) — สลับเป็น provider อื่นได้ผ่าน env AI_BASE_URL / AI_MODEL
// ใช้สร้างคำแปล / ประโยคตัวอย่าง / ข้อมูลที่ควรรู้ ของคำศัพท์

export type VocabExample = { en: string; th: string };

// บังคับให้คำศัพท์เป็น Pascal Case เสมอ (ขึ้นต้นตัวใหญ่ทุกคำ) แม้พิมพ์มาเป็นตัวเล็ก
// เช่น "improve" -> "Improve", "ice cream" -> "Ice Cream"
export function toPascalCase(input: string): string {
  return input
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}

export type GeneratedVocab = {
  word: string;
  translation: string;
  partOfSpeech: string;
  pronunciation: string;
  examples: VocabExample[];
  notes: string;
};

const SYSTEM_PROMPT = `คุณคือผู้ช่วยสอนภาษาอังกฤษสำหรับคนไทย
เมื่อได้รับคำศัพท์ภาษาอังกฤษหนึ่งคำ ให้สร้างข้อมูลช่วยจำที่ใช้งานได้จริง
ตอบกลับเป็น JSON ตามรูปแบบนี้เท่านั้น ห้ามมีข้อความอื่นนอก JSON:
{
  "word": "คำศัพท์ (แก้ตัวสะกดให้ถูกถ้าพิมพ์ผิด)",
  "translation": "คำแปลภาษาไทยสั้น กระชับ",
  "partOfSpeech": "ชนิดของคำ เช่น noun, verb, adjective",
  "pronunciation": "คำอ่านแบบไทย หรือ IPA",
  "examples": [
    { "en": "ประโยคตัวอย่างภาษาอังกฤษง่าย ๆ ที่ใช้ในชีวิตประจำวัน", "th": "คำแปลภาษาไทย" }
  ],
  "notes": "สิ่งที่ควรรู้เพิ่มเติม เช่น คำพ้อง วิธีใช้งาน ข้อควรระวัง (ภาษาไทย)"
}
ให้ examples 2-3 ประโยค`;

export async function generateVocab(word: string): Promise<GeneratedVocab> {
  // รองรับ env แบบทั่วไป (AI_*) โดยยังเข้ากันได้กับของเดิม (ZAI_*)
  // ค่า default ชี้ไปที่ Groq ซึ่งมี free tier (OpenAI-compatible)
  const apiKey = process.env.AI_API_KEY ?? process.env.ZAI_API_KEY;
  const baseUrl =
    process.env.AI_BASE_URL ??
    process.env.ZAI_BASE_URL ??
    "https://api.groq.com/openai/v1";
  const model =
    process.env.AI_MODEL ?? process.env.ZAI_MODEL ?? "llama-3.3-70b-versatile";

  if (!apiKey) {
    throw new Error("AI_API_KEY is not set");
  }

  const res = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      temperature: 0.6,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: `คำศัพท์: ${word}` },
      ],
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Z.ai request failed (${res.status}): ${text}`);
  }

  const data = await res.json();
  const content: string = data?.choices?.[0]?.message?.content ?? "";

  const parsed = parseJson(content);

  return {
    // ใช้คำที่ AI แก้สะกดให้แล้ว และบังคับเป็น Pascal Case เสมอ
    word: toPascalCase(String(parsed.word ?? word)),
    translation: String(parsed.translation ?? "").trim(),
    partOfSpeech: String(parsed.partOfSpeech ?? "").trim(),
    pronunciation: String(parsed.pronunciation ?? "").trim(),
    examples: Array.isArray(parsed.examples)
      ? parsed.examples
          .filter((e: unknown): e is VocabExample =>
            !!e && typeof (e as VocabExample).en === "string",
          )
          .map((e: VocabExample) => ({ en: String(e.en), th: String(e.th ?? "") }))
      : [],
    notes: String(parsed.notes ?? "").trim(),
  };
}

// บางครั้งโมเดลอาจห่อ JSON ด้วย ```json ... ``` -> ดึงเฉพาะส่วน JSON
function parseJson(content: string): Record<string, unknown> {
  try {
    return JSON.parse(content);
  } catch {
    const match = content.match(/\{[\s\S]*\}/);
    if (match) {
      try {
        return JSON.parse(match[0]);
      } catch {
        /* fallthrough */
      }
    }
    throw new Error("ไม่สามารถอ่านผลลัพธ์จาก Z.ai ได้");
  }
}
