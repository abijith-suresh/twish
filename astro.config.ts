import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "astro/config";

// https://astro.build/config
export default defineConfig({
  // Update these after "Use this template":
  site: "https://YOUR-USERNAME.github.io",
  base: "/YOUR-PROJECT-NAME/",
  vite: {
    plugins: [tailwindcss()],
    resolve: {
      alias: {
        "@": "/src",
      },
    },
  },
});
