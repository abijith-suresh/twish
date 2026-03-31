import tailwindcss from "@tailwindcss/vite";
import solid from "@astrojs/solid-js";
import { defineConfig } from "astro/config";
import AstroPWA from "@vite-pwa/astro";

export default defineConfig({
  site: "https://unwrapped-tools.vercel.app",
  integrations: [
    solid(),
    AstroPWA({
      registerType: "autoUpdate",
      manifest: {
        id: "/",
        name: "unwrapped.tools",
        short_name: "unwrapped",
        description:
          "A collection of fast, local-first developer tools. No server, no uploads, no tracking.",
        theme_color: "#282a36",
        background_color: "#282a36",
        display: "standalone",
        start_url: "/",
        scope: "/",
        icons: [
          {
            src: "/icons/icon-192.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "/icons/icon-512.png",
            sizes: "512x512",
            type: "image/png",
          },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2}"],
        navigateFallback: "/",
      },
    }),
  ],
  vite: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    plugins: [tailwindcss() as any],
    resolve: {
      alias: {
        "@": "/src",
      },
    },
  },
});
