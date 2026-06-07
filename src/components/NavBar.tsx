import Link from "next/link";
import { signOut } from "@/auth";
import type { Session } from "next-auth";

const links = [
  { href: "/", label: "หน้าหลัก" },
  { href: "/vocab", label: "เพิ่มคำศัพท์" },
  { href: "/review", label: "ทบทวน" },
  { href: "/feed", label: "ข่าว/วิดีโอ" },
];

export function NavBar({ user }: { user: Session["user"] }) {
  return (
    <header className="border-b border-white/10 bg-black/20 backdrop-blur">
      <nav className="mx-auto flex w-full max-w-5xl items-center justify-between px-4 py-3">
        <div className="flex items-center gap-6">
          <Link href="/" className="text-lg font-bold tracking-tight">
            📚 Easy<span className="text-emerald-400">Remember</span>
          </Link>
          <ul className="hidden gap-4 text-sm text-white/80 sm:flex">
            {links.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="hover:text-white">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div className="flex items-center gap-3">
          <span className="hidden text-sm text-white/70 sm:inline">
            {user?.name ?? user?.email}
          </span>
          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/login" });
            }}
          >
            <button
              type="submit"
              className="rounded-md border border-white/15 px-3 py-1 text-sm text-white/80 hover:bg-white/10"
            >
              ออกจากระบบ
            </button>
          </form>
        </div>
      </nav>
      <ul className="flex gap-4 overflow-x-auto px-4 pb-2 text-sm text-white/80 sm:hidden">
        {links.map((l) => (
          <li key={l.href}>
            <Link href={l.href} className="whitespace-nowrap hover:text-white">
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </header>
  );
}
