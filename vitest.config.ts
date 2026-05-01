import solid from "vite-plugin-solid";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [solid({ ssr: true })],
  test: {
    environment: "node",
    globals: true,
    include: ["src/**/*.{test,spec}.{js,ts}"],
  },
});
