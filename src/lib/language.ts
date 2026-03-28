export const SUPPORTED_LANGUAGES = [
  "text",
  "json",
  "yaml",
  "javascript",
  "typescript",
  "python",
  "markdown",
  "xml",
  "html",
] as const;

export type Language = (typeof SUPPORTED_LANGUAGES)[number];
