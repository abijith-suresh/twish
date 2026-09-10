import sitemap from "@astrojs/sitemap";
import solid from "@astrojs/solid-js";
import tailwindcss from "@tailwindcss/vite";
import AstroPWA from "@vite-pwa/astro";
import { defineConfig } from "astro/config";

export default defineConfig({
  site: "https://unwrapped-tools.vercel.app",
  integrations: [
    solid(),
    sitemap(),
    AstroPWA({
      strategies: "injectManifest",
      srcDir: "src",
      filename: "sw.ts",
      injectManifest: {
        globPatterns: ["**/*.{css,html,js,png,svg,webmanifest,woff2}"],
      },
      includeAssets: ["favicon.svg", "og-image.png"],
      manifest: {
        id: "/",
        name: "unwrapped.tools",
        short_name: "unwrapped",
        description: "Local-only developer tools that run entirely in your browser.",
        theme_color: "#0b0f0d",
        background_color: "#0b0f0d",
        display: "standalone",
        scope: "/",
        start_url: "/",
        icons: [
          {
            src: "/icon-192.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "any maskable",
          },
          {
            src: "/icon-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any maskable",
          },
        ],
      },
    }),
  ],
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
