export const SUPPORTED_LANGUAGES = [
  "text",
  "json",
  "toml",
  "yaml",
  "env",
  "javascript",
  "typescript",
  "python",
  "markdown",
  "xml",
  "html",
  "ini",
  "shell",
  "dockerfile",
] as const;

export type Language = (typeof SUPPORTED_LANGUAGES)[number];
