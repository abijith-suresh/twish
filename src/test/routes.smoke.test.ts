import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, rmSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { beforeAll, describe, expect, it } from "vitest";

import { getToolRoute, tools } from "../tools/registry";

const testDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(testDir, "../..");
const distDir = resolve(repoRoot, ".astro-test-dist");

function readBuiltHtml(filePath: string): string {
  const absolutePath = resolve(distDir, filePath);
  expect(existsSync(absolutePath)).toBe(true);
  return readFileSync(absolutePath, "utf8");
}

function readBuiltAsset(filePath: string): string {
  const absolutePath = resolve(distDir, filePath);
  expect(existsSync(absolutePath)).toBe(true);
  return readFileSync(absolutePath, "utf8");
}

beforeAll(() => {
  rmSync(distDir, { force: true, recursive: true });

  execFileSync("bunx", ["astro", "build", "--outDir", distDir], {
    cwd: repoRoot,
    stdio: "inherit",
  });
}, 30000);

describe("route smoke", () => {
  it("builds the home route with links to every registered tool", () => {
    const html = readBuiltHtml("index.html");

    expect(html).toContain("unwrapped.tools");
    expect(html).toContain("/manifest.webmanifest");

    for (const tool of tools) {
      expect(html).toContain(getToolRoute(tool.slug));
    }
  });

  for (const tool of tools) {
    it(`builds ${getToolRoute(tool.slug)}`, () => {
      const html = readBuiltHtml(`tools/${tool.slug}/index.html`);

      expect(html).toContain(tool.name);
      expect(html).toContain(tool.description);
      expect(html).toContain("/manifest.webmanifest");
    });
  }

  it("precaches the home route and every registered tool route in the service worker", () => {
    const serviceWorker = readBuiltAsset("sw.js");

    expect(serviceWorker).toMatch(/"url":\s*"\/"/);

    for (const tool of tools) {
      expect(serviceWorker).toMatch(new RegExp(`"url":\\s*"${getToolRoute(tool.slug).slice(1)}"`));
    }
  });
});
