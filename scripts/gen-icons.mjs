import sharp from "sharp";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

// แปลงไอคอน SVG -> PNG จริง (iOS apple-touch-icon ไม่รองรับ SVG)
// รันครั้งเดียวเมื่อแก้ icon.svg: node scripts/gen-icons.mjs
const root = fileURLToPath(new URL("..", import.meta.url));
const svg = readFileSync(root + "public/icon.svg");

const targets = [
  { out: "src/app/apple-icon.png", size: 180 },
  { out: "public/icon-192.png", size: 192 },
  { out: "public/icon-512.png", size: 512 },
];

for (const t of targets) {
  await sharp(svg, { density: 384 })
    .resize(t.size, t.size)
    .png()
    .toFile(root + t.out);
  console.log("created", t.out);
}
