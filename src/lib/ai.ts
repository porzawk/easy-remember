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

const SYSTEM_PROMPT = `คุณคือผู้ช่วยสอนภาษาอังกฤษสำหรับคนไทย เน้นการนำไปใช้ในชีวิตประจำวันจริง
(ที่ทำงาน การสนทนา การเดินทาง โซเชียล อีเมล) ไม่ใช่ภาษาวิชาการหรือในเกม
เมื่อได้รับคำศัพท์ภาษาอังกฤษหนึ่งคำ ให้สร้างข้อมูลช่วยจำที่ใช้งานได้จริง
ตอบกลับเป็น JSON ตามรูปแบบนี้เท่านั้น ห้ามมีข้อความอื่นนอก JSON:
{
  "word": "คำศัพท์ (แก้ตัวสะกดให้ถูกถ้าพิมพ์ผิด)",
  "translation": "คำแปลภาษาไทยสั้น กระชับ",
  "partOfSpeech": "ชนิดของคำ เช่น noun, verb, adjective",
  "pronunciation": "คำอ่านแบบไทย หรือ IPA",
  "examples": [
    { "en": "ประโยคที่เจอบ่อยในชีวิตประจำวันจริง พูดได้เลย", "th": "คำแปลภาษาไทย" }
  ],
  "notes": "สิ่งที่ควรรู้เพื่อใช้ให้ถูก: คำที่มักใช้คู่กัน (collocations), สถานการณ์ที่ใช้, ระดับความสุภาพ/ทางการ, ข้อควรระวัง (ภาษาไทย)"
}
ให้ examples 3 ประโยคจากสถานการณ์ในชีวิตประจำวันที่ต่างกัน`;

// เรียก Chat Completions (OpenAI-compatible) แล้วคืนเนื้อหา JSON เป็น string
// รองรับ env แบบทั่วไป (AI_*) โดยยังเข้ากันได้กับของเดิม (ZAI_*)
// ค่า default ชี้ไปที่ Groq ซึ่งมี free tier
async function chatJson(
  systemPrompt: string,
  userPrompt: string,
  temperature = 0.6,
): Promise<string> {
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
      temperature,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`AI request failed (${res.status}): ${text}`);
  }

  const data = await res.json();
  return data?.choices?.[0]?.message?.content ?? "";
}

export async function generateVocab(word: string): Promise<GeneratedVocab> {
  const content = await chatJson(SYSTEM_PROMPT, `คำศัพท์: ${word}`);
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

// ===== ฝึกแต่งประโยคเอง (production practice) =====
export type SentenceCheck = {
  correct: boolean; // ใช้คำถูกบริบทและไวยากรณ์โอเคไหม
  corrected: string; // ประโยคที่แก้ให้ถูก/เป็นธรรมชาติขึ้น
  feedback: string; // คำอธิบายภาษาไทย สั้น เป็นกำลังใจ
};

const CHECK_SYSTEM_PROMPT = `คุณคือครูสอนภาษาอังกฤษที่ใจดีสำหรับคนไทย
ผู้เรียนจะแต่งประโยคภาษาอังกฤษเองโดยใช้คำที่กำหนด หน้าที่คุณคือตรวจว่าใช้ "คำนั้น" ถูกความหมายและบริบทไหม และไวยากรณ์โอเคไหม
ตอบกลับเป็น JSON เท่านั้น ห้ามมีข้อความอื่นนอก JSON:
{
  "correct": true/false,  // true ถ้าใช้คำถูกบริบทและสื่อสารเข้าใจได้ (ผิดเล็กน้อยเรื่องไวยากรณ์ยังถือว่า true ได้)
  "corrected": "ประโยคเดิมที่แก้ให้ถูกและเป็นธรรมชาติแบบเจ้าของภาษา ถ้าถูกอยู่แล้วก็คืนประโยคเดิม",
  "feedback": "อธิบายเป็นภาษาไทยสั้น ๆ ว่าดีตรงไหน/ควรปรับอะไร ให้กำลังใจ"
}`;

export async function checkSentence(
  word: string,
  sentence: string,
): Promise<SentenceCheck> {
  const content = await chatJson(
    CHECK_SYSTEM_PROMPT,
    `คำที่ต้องใช้: ${word}\nประโยคของผู้เรียน: ${sentence}`,
    0.3,
  );
  const parsed = parseJson(content);
  return {
    correct: Boolean(parsed.correct),
    corrected: String(parsed.corrected ?? sentence).trim(),
    feedback: String(parsed.feedback ?? "").trim(),
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
