import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { Resvg } from "@resvg/resvg-js";

const svgPath = join(import.meta.dir, "../public/favicon.svg");
const svg = readFileSync(svgPath, "utf8");

const SIZES = [
  { name: "icon-192.png", size: 192 },
  { name: "icon-512.png", size: 512 },
  { name: "apple-touch-icon.png", size: 180 },
] as const;

for (const { name, size } of SIZES) {
  const resvg = new Resvg(svg, {
    fitTo: { mode: "width", value: size },
    font: { loadSystemFonts: true },
  });
  writeFileSync(join(import.meta.dir, "../public", name), resvg.render().asPng());
}
