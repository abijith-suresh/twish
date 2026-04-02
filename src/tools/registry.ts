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
  componentPath: string;
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
    componentPath: "/src/tools/jwt-decoder/JwtDecoder.tsx",
  },
  {
    id: "diff",
    name: "Text Diff",
    description: "Compare two texts or configs side by side with highlighted differences.",
    category: "text",
    keywords: ["diff", "compare", "config", "delta", "difference", "text"],
    icon: "GitCompare",
    slug: "diff",
    componentPath: "/src/tools/diff/DiffTool.tsx",
  },
  {
    id: "base64",
    name: "Base64",
    description: "Encode and decode Base64 strings. Supports file drag-and-drop.",
    category: "encoding",
    keywords: ["base64", "encode", "decode", "binary", "btoa", "atob"],
    icon: "Binary",
    slug: "base64",
    componentPath: "/src/tools/base64/Base64Tool.tsx",
  },
  {
    id: "json-formatter",
    name: "JSON Formatter",
    description: "Format, validate, and minify JSON with syntax highlighting.",
    category: "data",
    keywords: ["json", "format", "prettify", "minify", "validate", "lint"],
    icon: "Braces",
    slug: "json-formatter",
    componentPath: "/src/tools/json-formatter/JsonFormatter.tsx",
  },
  {
    id: "hash-generator",
    name: "Hash Generator",
    description: "Generate SHA-1, SHA-256, SHA-384, and SHA-512 hashes from text.",
    category: "security",
    keywords: ["hash", "sha", "sha256", "sha512", "checksum", "digest", "crypto"],
    icon: "Fingerprint",
    slug: "hash-generator",
    componentPath: "/src/tools/hash-generator/HashGenerator.tsx",
  },
  {
    id: "uuid-generator",
    name: "UUID Generator",
    description: "Generate cryptographically secure UUIDs (v4) in bulk.",
    category: "generators",
    keywords: ["uuid", "guid", "unique", "id", "random", "generate"],
    icon: "Shuffle",
    slug: "uuid-generator",
    componentPath: "/src/tools/uuid-generator/UuidGenerator.tsx",
  },
  {
    id: "timestamp",
    name: "Timestamp Converter",
    description: "Convert Unix timestamps to human-readable dates across timezones.",
    category: "time",
    keywords: ["timestamp", "unix", "epoch", "date", "time", "convert", "utc"],
    icon: "Clock",
    slug: "timestamp",
    componentPath: "/src/tools/timestamp/TimestampTool.tsx",
  },
  {
    id: "regex-tester",
    name: "Regex Tester",
    description: "Test regular expressions with real-time match highlighting.",
    category: "text",
    keywords: ["regex", "regexp", "regular expression", "pattern", "match", "test"],
    icon: "Regex",
    slug: "regex-tester",
    componentPath: "/src/tools/regex-tester/RegexTester.tsx",
  },
];

export function getToolRoute(slug: string): `/tools/${string}` {
  return `/tools/${slug}`;
}

export function validateToolRegistry(availableComponentPaths: readonly string[] = []): string[] {
  const errors: string[] = [];
  const seenIds = new Set<string>();
  const seenSlugs = new Set<string>();

  for (const tool of tools) {
    if (seenIds.has(tool.id)) {
      errors.push(`Duplicate tool id: ${tool.id}`);
    } else {
      seenIds.add(tool.id);
    }

    if (seenSlugs.has(tool.slug)) {
      errors.push(`Duplicate tool slug: ${tool.slug}`);
    } else {
      seenSlugs.add(tool.slug);
    }

    if (
      availableComponentPaths.length > 0 &&
      !availableComponentPaths.includes(tool.componentPath)
    ) {
      errors.push(`Missing tool component: ${tool.componentPath}`);
    }
  }

  return errors;
}

export function getToolBySlug(slug: string): Tool | undefined {
  return tools.find((t) => t.slug === slug);
}

export function getToolsByCategory(category: ToolCategory): Tool[] {
  return tools.filter((t) => t.category === category);
}
