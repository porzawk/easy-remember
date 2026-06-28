import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// อย่าให้ Next แคชหน้านี้ — ต้องยิงโดน DB จริงทุกครั้งเพื่อปลุก Neon
export const dynamic = "force-dynamic";
export const revalidate = 0;

// GET /api/health — ping เบา ๆ เพื่อกัน Neon compute หลับ (auto-suspend)
// ใช้กับ cron ภายนอก (GitHub Actions / cron-job.org) ยิงทุก ~4 นาที
export async function GET() {
  const startedAt = Date.now();
  try {
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json({
      ok: true,
      db: "up",
      ms: Date.now() - startedAt,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown error";
    return NextResponse.json(
      { ok: false, db: "down", ms: Date.now() - startedAt, error: message },
      { status: 503 }
    );
  }
}
