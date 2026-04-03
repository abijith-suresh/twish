export type FlagKey = "g" | "i" | "m" | "s";

export interface CaptureGroup {
  name: string | null;
  value: string;
}

export interface MatchResult {
  index: number;
  fullMatch: string;
  groups: CaptureGroup[];
}

export interface RegexResult {
  matches: MatchResult[];
  highlighted: string;
  error: string | null;
}

export function escapeHtml(str: string): string {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export function buildRegexResult(pattern: string, flags: Set<FlagKey>, input: string): RegexResult {
  if (!pattern) {
    return { matches: [], highlighted: escapeHtml(input), error: null };
  }

  let regex: RegExp;
  const flagString = [...flags].join("");

  try {
    regex = new RegExp(pattern, flagString.includes("g") ? flagString : flagString + "g");
  } catch (error) {
    return {
      matches: [],
      highlighted: escapeHtml(input),
      error: error instanceof Error ? error.message : "Invalid regular expression",
    };
  }

  const matches: MatchResult[] = [];
  const ranges: [number, number][] = [];

  let match: RegExpExecArray | null;
  let lastIndex = -1;

  while ((match = regex.exec(input)) !== null) {
    if (match.index === lastIndex) {
      regex.lastIndex += 1;
      continue;
    }

    lastIndex = match.index;
    const groups: CaptureGroup[] = [];

    if (match.groups) {
      for (const [name, value] of Object.entries(match.groups)) {
        groups.push({ name, value: value ?? "" });
      }
    }

    for (let index = 1; index < match.length; index++) {
      const alreadyNamed = match.groups && Object.values(match.groups).includes(match[index]);
      if (!alreadyNamed && match[index] !== undefined) {
        groups.push({ name: null, value: match[index] ?? "" });
      }
    }

    matches.push({
      index: match.index,
      fullMatch: match[0],
      groups,
    });
    ranges.push([match.index, match.index + match[0].length]);

    if (!flagString.includes("g")) {
      break;
    }
  }

  let highlighted = "";
  let position = 0;
  for (const [start, end] of ranges) {
    highlighted += escapeHtml(input.slice(position, start));
    highlighted += `<mark style="background:color-mix(in srgb,var(--accent-primary) 30%,transparent);border-radius:2px;color:inherit;">${escapeHtml(input.slice(start, end))}</mark>`;
    position = end;
  }
  highlighted += escapeHtml(input.slice(position));

  return { matches, highlighted, error: null };
}
