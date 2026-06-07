import type { Metadata } from "next";
import "./globals.css";
import { auth } from "@/auth";
import { NavBar } from "@/components/NavBar";

export const metadata: Metadata = {
  title: "Easy Remember — ฝึกศัพท์อังกฤษจากเกม",
  description: "เพิ่มคำศัพท์ ได้คำแปล + ประโยคตัวอย่าง และทบทวนให้ไม่ลืม",
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
