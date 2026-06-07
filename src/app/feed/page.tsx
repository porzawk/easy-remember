import { fetchNews } from "@/lib/feed";

export const revalidate = 1800;

// วิดีโอช่องฝึกภาษาอังกฤษ (embed YouTube)
const VIDEOS = [
  { id: "juKd26qkNAw", title: "English vocabulary in context" },
  { id: "EYxFyztMcMc", title: "Learn English through stories" },
  { id: "ED8jzgEy3kk", title: "Daily English listening practice" },
];

export default async function FeedPage() {
  const news = await fetchNews(12);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">ข่าว & วิดีโอภาษาอังกฤษ</h1>
        <p className="text-white/70">อ่านและฟังภาษาอังกฤษจริง ๆ เพื่อฝึกให้ชิน</p>
      </div>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">📰 ข่าวให้ฝึกอ่าน</h2>
        {news.length === 0 ? (
          <p className="rounded-xl border border-white/10 bg-white/5 p-6 text-white/60">
            โหลดข่าวไม่สำเร็จตอนนี้ ลองรีเฟรชอีกครั้งภายหลัง
          </p>
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2">
            {news.map((item, i) => (
              <li key={i}>
                <a
                  href={item.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block h-full rounded-xl border border-white/10 bg-white/5 p-4 hover:border-emerald-400/50 hover:bg-white/10"
                >
                  <span className="text-xs text-emerald-300">{item.source}</span>
                  <p className="mt-1 font-medium leading-snug">{item.title}</p>
                </a>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">🎬 วิดีโอฝึกฟัง</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {VIDEOS.map((v) => (
            <div key={v.id} className="space-y-2">
              <div className="aspect-video overflow-hidden rounded-xl border border-white/10">
                <iframe
                  className="h-full w-full"
                  src={`https://www.youtube.com/embed/${v.id}`}
                  title={v.title}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
              <p className="text-sm text-white/70">{v.title}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
