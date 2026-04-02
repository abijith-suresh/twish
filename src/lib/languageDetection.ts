import { type Language } from "./language";

const EXTENSION_LANGUAGE_MAP: Record<string, Language> = {
  ".env": "env",
  ".bash": "shell",
  ".conf": "ini",
  ".config": "ini",
  ".cfg": "ini",
  ".htm": "html",
  ".html": "html",
  ".ini": "ini",
  ".js": "javascript",
  ".json": "json",
  ".jsx": "javascript",
  ".md": "markdown",
  ".markdown": "markdown",
  ".py": "python",
  ".sh": "shell",
  ".toml": "toml",
  ".ts": "typescript",
  ".tsx": "typescript",
  ".xml": "xml",
  ".yaml": "yaml",
  ".yml": "yaml",
};

function detectFromFilename(filename: string): Language | null {
  const lowerFilename = filename.trim().toLowerCase();

  if (lowerFilename.length === 0) {
    return null;
  }

  if (lowerFilename === ".env" || lowerFilename.startsWith(".env.")) {
    return "env";
  }

  if (lowerFilename === "dockerfile") {
    return "dockerfile";
  }

  const extension = Object.keys(EXTENSION_LANGUAGE_MAP).find((candidate) =>
    lowerFilename.endsWith(candidate)
  );

  return extension ? EXTENSION_LANGUAGE_MAP[extension] : null;
}

function detectFromContent(content: string): Language | null {
  const trimmed = content.trim();

  if (trimmed.length === 0) {
    return null;
  }

  if (
    (trimmed.startsWith("{") && trimmed.endsWith("}")) ||
    (trimmed.startsWith("[") && trimmed.endsWith("]"))
  ) {
    try {
      JSON.parse(trimmed);
      return "json";
    } catch {
      return null;
    }
  }

  if (trimmed.startsWith("<?xml") || trimmed.startsWith("<")) {
    return trimmed.startsWith("<!DOCTYPE html") || trimmed.includes("<html") ? "html" : "xml";
  }

  if (/^---\s*$/m.test(content) || /^\s*[\w-]+\s*:\s+.+$/m.test(content)) {
    return "yaml";
  }

  if (
    /^\s*(interface|type)\s+\w+/m.test(content) ||
    /:\s*(string|number|boolean)\b/m.test(content)
  ) {
    return "typescript";
  }

  if (/^\s*(export\s+)?(const|let|var|function)\s+/m.test(content)) {
    return "javascript";
  }

  if (/^\s*def\s+\w+\(/m.test(content) || /^\s*import\s+\w+/m.test(content)) {
    return "python";
  }

  const significantLines = content
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && !line.startsWith("#"));

  if (
    significantLines.length > 1 &&
    significantLines.every((line) => /^(export\s+)?[A-Za-z_][A-Za-z0-9_.-]*\s*=/.test(line))
  ) {
    return "env";
  }

  if (/^#\s+/m.test(content) || /```/.test(content)) {
    return "markdown";
  }

  return null;
}

export function detectLanguage(input: { filename?: string; content?: string }): Language {
  const fromFilename = detectFromFilename(input.filename ?? "");
  if (fromFilename) {
    return fromFilename;
  }

  const fromContent = detectFromContent(input.content ?? "");
  return fromContent ?? "text";
}
