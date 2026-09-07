// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck - TS 6.x has excessive type depth with @tailwindcss/vite
import solid from "@astrojs/solid-js";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "astro/config";

export default defineConfig({
  site: "https://unwrapped-tools.vercel.app",
  integrations: [solid()],
  vite: {
    plugins: [...tailwindcss()],
    resolve: {
      alias: {
        "@": "/src",
        "lucide-solid": "/node_modules/lucide-solid/dist/source/lucide-solid.jsx",
      },
    },
  },
});
