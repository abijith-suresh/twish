import type { Tool } from "@/tools/registry";

/**
 * Simple fuzzy search over the tool registry.
 * Checks name, description, and keywords against the query.
 * Returns tools sorted by relevance (name match > description match > keyword match).
 */
export function searchTools(tools: Tool[], query: string): Tool[] {
  const q = query.trim().toLowerCase();
  if (!q) return tools;

  const scored = tools.map((tool) => {
    const name = tool.name.toLowerCase();
    const desc = tool.description.toLowerCase();
    const keywords = tool.keywords.join(" ").toLowerCase();

    let score = 0;
    if (name.startsWith(q)) score += 100;
    else if (name.includes(q)) score += 60;
    if (desc.includes(q)) score += 30;
    if (keywords.includes(q)) score += 20;

    return { tool, score };
  });

  return scored
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((s) => s.tool);
}
