# Easy Remember 📚

เว็บฝึกคำศัพท์ภาษาอังกฤษจากเกม — พิมพ์คำที่เจอในเกม รับคำแปล + ประโยคตัวอย่างจาก AI (Z.ai) และมีระบบทบทวนแบบ spaced repetition กันลืม

## ฟีเจอร์

- **หน้าหลัก (Dashboard)** — สรุปจำนวนคำศัพท์ เพิ่มสัปดาห์นี้ จำนวนครั้งที่ทบทวน และคำที่รอทบทวน พร้อมรายการคำล่าสุด
- **เพิ่มคำศัพท์** — กรอกคำ แล้ว AI (Z.ai) สร้างคำแปล ประโยคตัวอย่าง คำอ่าน และข้อควรรู้
- **ทบทวน (Spaced Repetition)** — เอาคำที่เพิ่มเกิน 3 วันมาให้ทบทวนเป็น flashcard
  - ทบทวนครบ 10 ครั้งแล้ว ไม่แสดงอีก
  - คำอายุ 3 วัน–1 เดือน: ทบทวนวันละครั้ง
  - คำอายุเกิน 1 เดือน: ทบทวนเดือนละครั้ง
- **ข่าว/วิดีโอ** — ดึงข่าวภาษาอังกฤษจาก RSS + วิดีโอ YouTube ฝึกฟัง
- **ล็อกอิน** ด้วย Google (ข้อมูลแยกตาม account)

## Tech Stack

- Next.js 15 (App Router) + React 19 + TypeScript
- Tailwind CSS v4
- Prisma + PostgreSQL (Neon)
- Auth.js (NextAuth v5) — Google
- AI สร้างข้อมูลคำศัพท์ (OpenAI-compatible — default Groq ฟรี, สลับเป็น Gemini / Z.ai ได้)

## เริ่มต้นใช้งาน

### 1. ติดตั้ง dependencies

```bash
npm install
```

### 2. ตั้งค่า environment

คัดลอก `.env.example` เป็น `.env` แล้วเติมค่า:

```bash
cp .env.example .env
```

ค่าที่ต้องเตรียม:

| ตัวแปร | เอามาจากไหน |
| --- | --- |
| `DATABASE_URL` | [Neon Console](https://console.neon.tech/) → Connection string (pooled) |
| `AUTH_SECRET` | รัน `npx auth secret` (หรือ `openssl rand -base64 32`) |
| `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` | [Google Cloud Console](https://console.cloud.google.com/apis/credentials) |
| `AI_API_KEY` | [Groq Console](https://console.groq.com/keys) (ฟรี) — หรือ provider อื่นที่เป็น OpenAI-compatible |

**Redirect URI** ที่ต้องตั้งใน OAuth provider (ตอน dev):

- Google: `http://localhost:3000/api/auth/callback/google`

### 3. สร้างตารางในฐานข้อมูล

```bash
npm run db:push
```

### 4. รัน dev server

```bash
npm run dev
```

เปิด http://localhost:3000

## คำสั่งที่ใช้บ่อย

```bash
npm run dev        # รัน dev server
npm run build      # build production (generate prisma + next build)
npm run start      # รัน production server
npm run db:push    # sync schema -> ฐานข้อมูล
npm run db:studio  # เปิด Prisma Studio ดูข้อมูล
```

## โครงสร้างโปรเจค

```
src/
├── app/
│   ├── page.tsx              # Dashboard
│   ├── login/page.tsx        # หน้า login (Google)
│   ├── vocab/page.tsx        # เพิ่มคำศัพท์ (AI preview + save)
│   ├── review/page.tsx       # ทบทวน flashcard
│   ├── feed/page.tsx         # ข่าว + วิดีโอ
│   └── api/
│       ├── auth/[...nextauth]/route.ts
│       ├── vocab/route.ts            # list / create
│       ├── vocab/[id]/route.ts       # delete
│       ├── vocab/generate/route.ts   # เรียก Z.ai (preview)
│       └── review/route.ts           # due words / mark reviewed
├── lib/
│   ├── prisma.ts             # Prisma client
│   ├── zai.ts                # Z.ai integration
│   ├── review.ts             # ตรรกะ spaced repetition
│   └── feed.ts               # ดึง/parse RSS ข่าว
├── components/NavBar.tsx
├── auth.ts / auth.config.ts  # Auth.js
└── middleware.ts             # ป้องกันเส้นทางที่ต้อง login

prisma/schema.prisma          # User/Account/Session + Vocab
```
