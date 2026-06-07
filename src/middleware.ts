import NextAuth from "next-auth";
import { authConfig } from "@/auth.config";

// ใช้ config แบบ edge-safe (ไม่มี Prisma) ป้องกันเส้นทางทั้งหมดยกเว้น api/static
export const { auth: middleware } = NextAuth(authConfig);

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
