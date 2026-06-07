// ดึงข่าวภาษาอังกฤษจาก RSS มาให้ฝึกอ่าน (ไม่ต้องใช้ API key)

export type NewsItem = {
  title: string;
  link: string;
  source: string;
};

const FEEDS: { url: string; source: string }[] = [
  { url: "https://feeds.bbci.co.uk/news/world/rss.xml", source: "BBC World" },
  { url: "https://www.sciencedaily.com/rss/top/science.xml", source: "ScienceDaily" },
];

export async function fetchNews(limit = 12): Promise<NewsItem[]> {
  const results = await Promise.allSettled(
    FEEDS.map((f) => fetchFeed(f.url, f.source)),
  );

  const items = results
    .filter((r): r is PromiseFulfilledResult<NewsItem[]> => r.status === "fulfilled")
    .flatMap((r) => r.value);

  // สลับสองแหล่งให้คละกัน แล้วตัดตามจำนวน
  return interleave(items).slice(0, limit);
}

async function fetchFeed(url: string, source: string): Promise<NewsItem[]> {
  const res = await fetch(url, {
    next: { revalidate: 1800 }, // cache 30 นาที
    headers: { "User-Agent": "EasyRemember/1.0" },
  });
  if (!res.ok) return [];
  const xml = await res.text();
  return parseRss(xml, source).slice(0, 8);
}

function parseRss(xml: string, source: string): NewsItem[] {
  const items: NewsItem[] = [];
  const blocks = xml.split(/<item[\s>]/).slice(1);

  for (const block of blocks) {
    const title = clean(extract(block, "title"));
    const link = clean(extract(block, "link"));
    if (title && link) items.push({ title, link, source });
  }
  return items;
}

function extract(block: string, tag: string): string {
  const match = block.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i"));
  return match ? match[1] : "";
}

function clean(raw: string): string {
  return raw
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .trim();
}

function interleave(items: NewsItem[]): NewsItem[] {
  const bySource = new Map<string, NewsItem[]>();
  for (const item of items) {
    if (!bySource.has(item.source)) bySource.set(item.source, []);
    bySource.get(item.source)!.push(item);
  }
  const lists = [...bySource.values()];
  const out: NewsItem[] = [];
  let added = true;
  let i = 0;
  while (added) {
    added = false;
    for (const list of lists) {
      if (list[i]) {
        out.push(list[i]);
        added = true;
      }
    }
    i++;
  }
  return out;
}
