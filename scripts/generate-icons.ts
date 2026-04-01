import sharp from "sharp";
import { readFileSync } from "fs";
import { join } from "path";

const svgPath = join(import.meta.dir, "../public/favicon.svg");
const svg = readFileSync(svgPath);

const sizes = [
  { size: 192, output: join(import.meta.dir, "../public/icons/icon-192.png") },
  { size: 512, output: join(import.meta.dir, "../public/icons/icon-512.png") },
];

for (const { size, output } of sizes) {
  await sharp(svg).resize(size, size).png().toFile(output);
  console.warn(`Generated ${output}`);
}
