import sitemap from "@astrojs/sitemap";
import solid from "@astrojs/solid-js";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "astro/config";

export default defineConfig({
  site: "https://unwrapped-tools.vercel.app",
  integrations: [solid(), sitemap()],
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
