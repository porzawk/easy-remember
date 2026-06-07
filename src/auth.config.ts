import type { NextAuthConfig } from "next-auth";
import Google from "next-auth/providers/google";

// ส่วนนี้ edge-safe (ไม่มี Prisma) ใช้ร่วมกับ middleware ได้
export const authConfig = {
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
    }),
  ],
  pages: {
    signIn: "/login",
  },
  session: { strategy: "jwt" },
  callbacks: {
    // เก็บ user id ไว้ใน token เพื่อใช้ฝั่ง server/middleware
    jwt({ token, user }) {
      if (user) token.id = user.id;
      return token;
    },
    session({ session, token }) {
      if (token.id && session.user) {
        session.user.id = token.id as string;
      }
      return session;
    },
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isOnLogin = nextUrl.pathname.startsWith("/login");
      if (isOnLogin) {
        // ถ้า login แล้วเข้า /login ให้เด้งไปหน้าหลัก
        if (isLoggedIn) return Response.redirect(new URL("/", nextUrl));
        return true;
      }
      return isLoggedIn; // หน้าที่เหลือต้อง login ก่อน
    },
  },
} satisfies NextAuthConfig;
