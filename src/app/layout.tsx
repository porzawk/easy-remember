import type { Metadata, Viewport } from "next";
import "./globals.css";
import { auth } from "@/auth";
import { NavBar } from "@/components/NavBar";

export const metadata: Metadata = {
  title: "Easy Remember — ฝึกศัพท์ภาษาอังกฤษ",
  description: "เพิ่มคำศัพท์ ได้คำแปล + ประโยคตัวอย่าง และทบทวนให้ไม่ลืม",
  manifest: "/manifest.webmanifest",
  // เปิดแบบแอป (ไม่มีแถบ URL) เมื่อเพิ่มไปหน้าจอโฮมบน iOS
  appleWebApp: {
    capable: true,
    title: "EasyRemember",
    statusBarStyle: "black-translucent",
  },
  other: {
    "mobile-web-app-capable": "yes",
  },
};

export const viewport: Viewport = {
  themeColor: "#030a06",
  width: "device-width",
  initialScale: 1,
  // กันการซูม/เด้งให้รู้สึกเหมือนแอปเนทีฟมากขึ้น
  maximumScale: 1,
  viewportFit: "cover",
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const session = await auth();

  return (
    <html lang="th">
      <body>
        {session?.user && <NavBar user={session.user} />}
        <main className="mx-auto w-full max-w-5xl px-4 py-6">{children}</main>
      </body>
    </html>
  );
}
