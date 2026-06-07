import { signIn } from "@/auth";

export default function LoginPage() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center gap-8 text-center">
      <div>
        <h1 className="text-3xl font-bold">📚 Easy Remember</h1>
        <p className="mt-2 max-w-md text-white/70">
          เพิ่มคำศัพท์จากเกมที่เล่น แล้วรับคำแปล + ประโยคตัวอย่างจาก AI
          พร้อมระบบทบทวนให้ไม่ลืม
        </p>
      </div>

      <div className="flex w-full max-w-xs flex-col gap-3">
        <form
          action={async () => {
            "use server";
            await signIn("google", { redirectTo: "/" });
          }}
        >
          <button
            type="submit"
            className="w-full rounded-lg bg-white px-4 py-3 font-medium text-gray-800 hover:bg-gray-100"
          >
            เข้าสู่ระบบด้วย Google
          </button>
        </form>
      </div>
    </div>
  );
}
