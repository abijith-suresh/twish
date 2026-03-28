import { describe, expect, it } from "vitest";

import { detectLanguage } from "./languageDetection";

describe("language detection", () => {
  it("detects structured formats from filename extensions", () => {
    expect(detectLanguage({ filename: "config.json" })).toBe("json");
    expect(detectLanguage({ filename: "docker-compose.yml" })).toBe("yaml");
    expect(detectLanguage({ filename: "workflow.yaml" })).toBe("yaml");
    expect(detectLanguage({ filename: "notes.md" })).toBe("markdown");
  });

  it("treats env-style files as text to preserve raw diffing", () => {
    expect(detectLanguage({ filename: ".env" })).toBe("text");
    expect(detectLanguage({ filename: ".env.production" })).toBe("text");
  });

  it("falls back to JSON content detection when no filename is present", () => {
    expect(detectLanguage({ content: '{"b":2,"a":1}' })).toBe("json");
  });

  it("detects YAML-like content when no filename is present", () => {
    expect(detectLanguage({ content: "services:\n  api:\n    image: app:latest\n" })).toBe("yaml");
  });

  it("detects markup content heuristically", () => {
    expect(detectLanguage({ content: "<html><body>Hello</body></html>" })).toBe("html");
    expect(detectLanguage({ content: '<?xml version="1.0"?><root />' })).toBe("xml");
  });

  it("prefers TypeScript when type annotations are present", () => {
    expect(detectLanguage({ content: 'export const name: string = "twish";' })).toBe("typescript");
  });

  it("defaults to text when there is not enough signal", () => {
    expect(detectLanguage({ content: "plain text diff content" })).toBe("text");
  });
});
