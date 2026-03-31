export type ToolCategory =
  | "encoding"
  | "security"
  | "text"
  | "generators"
  | "time"
  | "data"
  | "network";

export interface Tool {
  id: string;
  name: string;
  description: string;
  category: ToolCategory;
  keywords: string[];
  icon: string; // lucide icon name
  slug: string; // matches folder name, used in URL
  isNew?: boolean;
}

export const tools: Tool[] = [
  {
    id: "jwt-decoder",
    name: "JWT Decoder",
    description: "Decode and inspect JSON Web Tokens. View header, payload, expiry.",
    category: "security",
    keywords: ["jwt", "token", "bearer", "auth", "decode", "json web token"],
    icon: "KeyRound",
    slug: "jwt-decoder",
    isNew: true,
  },
  {
    id: "diff",
    name: "Text Diff",
    description: "Compare two texts or configs side by side with highlighted differences.",
    category: "text",
    keywords: ["diff", "compare", "config", "delta", "difference", "text"],
    icon: "GitCompare",
    slug: "diff",
  },
  {
    id: "base64",
    name: "Base64",
    description: "Encode and decode Base64 strings. Supports file drag-and-drop.",
    category: "encoding",
    keywords: ["base64", "encode", "decode", "binary", "btoa", "atob"],
    icon: "Binary",
    slug: "base64",
  },
  {
    id: "json-formatter",
    name: "JSON Formatter",
    description: "Format, validate, and minify JSON with syntax highlighting.",
    category: "data",
    keywords: ["json", "format", "prettify", "minify", "validate", "lint"],
    icon: "Braces",
    slug: "json-formatter",
  },
  {
    id: "hash-generator",
    name: "Hash Generator",
    description: "Generate SHA-1, SHA-256, SHA-384, and SHA-512 hashes from text.",
    category: "security",
    keywords: ["hash", "sha", "sha256", "sha512", "checksum", "digest", "crypto"],
    icon: "Fingerprint",
    slug: "hash-generator",
  },
  {
    id: "uuid-generator",
    name: "UUID Generator",
    description: "Generate cryptographically secure UUIDs (v4) in bulk.",
    category: "generators",
    keywords: ["uuid", "guid", "unique", "id", "random", "generate"],
    icon: "Shuffle",
    slug: "uuid-generator",
  },
  {
    id: "timestamp",
    name: "Timestamp Converter",
    description: "Convert Unix timestamps to human-readable dates across timezones.",
    category: "time",
    keywords: ["timestamp", "unix", "epoch", "date", "time", "convert", "utc"],
    icon: "Clock",
    slug: "timestamp",
  },
  {
    id: "regex-tester",
    name: "Regex Tester",
    description: "Test regular expressions with real-time match highlighting.",
    category: "text",
    keywords: ["regex", "regexp", "regular expression", "pattern", "match", "test"],
    icon: "Regex",
    slug: "regex-tester",
  },
];

export function getToolBySlug(slug: string): Tool | undefined {
  return tools.find((t) => t.slug === slug);
}

export function getToolsByCategory(category: ToolCategory): Tool[] {
  return tools.filter((t) => t.category === category);
}
