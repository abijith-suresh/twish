import tailwindcss from "@tailwindcss/vite";
import solid from "@astrojs/solid-js";
import { defineConfig } from "astro/config";
import AstroPWA from "@vite-pwa/astro";

// https://astro.build/config
export default defineConfig({
  site: "https://twish.vercel.app",
  integrations: [
    solid(),
    AstroPWA({
      registerType: "autoUpdate",
      manifest: {
        name: "Twish",
        short_name: "Twish",
        description:
          "Offline file diff tool — compare configs and code without leaving your browser.",
        theme_color: "#ffffff",
        background_color: "#ffffff",
        display: "standalone",
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
