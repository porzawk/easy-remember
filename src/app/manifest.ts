import type { MetadataRoute } from "next";

// Web App Manifest — ทำให้ติดตั้งเป็นแอปบนหน้าจอโฮมได้
// display: "standalone" = เปิดแบบเต็มจอ ไม่มีแถบ URL / แท็บของเบราว์เซอร์
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Easy Remember — ฝึกศัพท์ภาษาอังกฤษ",
    short_name: "EasyRemember",
    description: "เพิ่มคำศัพท์ ได้คำแปล + ประโยคใช้จริง และทบทวนกันลืม",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#030a06",
    theme_color: "#030a06",
    lang: "th",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml" },
    ],
  };
}
