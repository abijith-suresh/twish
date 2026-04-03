export type IndentSize = 2 | 4;

export interface JsonFormatResult {
  html: string;
  raw: string;
  error: string | null;
  errorLine: number | null;
}

export function syntaxHighlightJson(json: string): string {
  return json
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(
      /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+-]?\d+)?)/g,
      (match) => {
        let style = "color: var(--accent-primary)";
        if (/^"/.test(match)) {
          style = /:$/.test(match)
            ? "color: var(--text-primary); font-weight: 600"
            : "color: var(--accent-success)";
        } else if (/true|false/.test(match)) {
          style = "color: var(--accent-warning)";
        } else if (/null/.test(match)) {
          style = "color: var(--text-muted)";
        }
        return `<span style="${style}">${match}</span>`;
      }
    );
}

export function parseJsonErrorPosition(message: string): number | null {
  const match = /line (\d+)/.exec(message) ?? /position (\d+)/.exec(message);
  if (!match) return null;
  return parseInt(match[1], 10);
}

export function formatJson(input: string, indent: IndentSize, minify: boolean): JsonFormatResult {
  const trimmed = input.trim();
  if (!trimmed) return { html: "", raw: "", error: null, errorLine: null };

  let parsed: unknown;
  try {
    parsed = JSON.parse(trimmed) as unknown;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      html: "",
      raw: "",
      error: `JSON parse error: ${message}`,
      errorLine: parseJsonErrorPosition(message),
    };
  }

  const raw = minify ? JSON.stringify(parsed) : JSON.stringify(parsed, null, indent);
  return {
    html: syntaxHighlightJson(raw),
    raw,
    error: null,
    errorLine: null,
  };
}
