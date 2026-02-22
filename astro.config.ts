import tailwindcss from "@tailwindcss/vite";
import react from "@astrojs/react";
import { defineConfig } from "astro/config";
import AstroPWA from "@vite-pwa/astro";

// https://astro.build/config
export default defineConfig({
  site: "https://abijith-suresh.github.io",
  base: "/twish",
  integrations: [
    react(),
    AstroPWA({
      registerType: "autoUpdate",
      manifest: {
        name: "Twish",
        short_name: "Twish",
        description:
          "Offline file diff tool — compare configs and code without leaving your browser.",
        theme_color: "#0f172a",
        background_color: "#0f172a",
        display: "standalone",
        icons: [
          {
            src: "/twish/icons/icon-192.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "/twish/icons/icon-512.png",
            sizes: "512x512",
            type: "image/png",
          },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2}"],
        navigateFallback: "/twish/",
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
