import { Prisma, PrismaClient } from "@prisma/client";

// รหัส error ที่เกิดตอน Neon compute กำลัง cold start (เพิ่ง wake จาก auto-suspend)
// P1001 = เชื่อมต่อ DB ไม่ได้, P1002 = timeout, P1017 = ถูกปิด connection
const TRANSIENT_CONNECTION_ERRORS = new Set(["P1001", "P1002", "P1017"]);

function isTransient(err: unknown): boolean {
  if (err instanceof Prisma.PrismaClientInitializationError) return true;
  if (
    err instanceof Prisma.PrismaClientKnownRequestError &&
    TRANSIENT_CONNECTION_ERRORS.has(err.code)
  ) {
    return true;
  }
  return false;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// ลองใหม่อัตโนมัติเมื่อเจอ connection error ระหว่าง Neon ตื่นจาก sleep
function withRetry(client: PrismaClient): PrismaClient {
  return client.$extends({
    query: {
      async $allOperations({ args, query }) {
        const maxAttempts = 4;
        let lastErr: unknown;
        for (let attempt = 1; attempt <= maxAttempts; attempt++) {
          try {
            return await query(args);
          } catch (err) {
            lastErr = err;
            if (!isTransient(err) || attempt === maxAttempts) throw err;
            // backoff: 0.5s, 1s, 2s — เผื่อเวลาให้ compute ตื่น
            await sleep(500 * 2 ** (attempt - 1));
          }
        }
        throw lastErr;
      },
    },
  }) as unknown as PrismaClient;
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  withRetry(
    new PrismaClient({
      log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
    })
  );

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
