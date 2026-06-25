import sharp from "sharp";
import { readFileSync } from "node:fs";

// แปลงไอคอน stock-news SVG -> PNG (ใช้ sharp ของ easy-remember)
const base = "f:/stock-news/web/public/";
const svg = readFileSync(base + "icon.svg");

const targets = [
  { out: "apple-icon.png", size: 180 },
  { out: "icon-192.png", size: 192 },
  { out: "icon-512.png", size: 512 },
];

for (const t of targets) {
  await sharp(svg, { density: 384 })
    .resize(t.size, t.size)
    .png()
    .toFile(base + t.out);
  console.log("created", base + t.out);
}
