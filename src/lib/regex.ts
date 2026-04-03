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

export interface RegexSummary {
  captureGroupCount: number;
  emptyMatchCount: number;
  firstMatchIndex: number | null;
}

export interface RegexReplaceResult {
  output: string;
  replacements: number;
}

export interface RegexResult {
  matches: MatchResult[];
  highlighted: string;
  error: string | null;
  summary: RegexSummary;
}

export function escapeHtml(str: string): string {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export function buildRegexResult(pattern: string, flags: Set<FlagKey>, input: string): RegexResult {
  if (!pattern) {
    return {
      matches: [],
      highlighted: escapeHtml(input),
      error: null,
      summary: createSummary([]),
    };
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
      summary: createSummary([]),
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

  return { matches, highlighted, error: null, summary: createSummary(matches) };
}

export function buildRegexReplaceResult(
  pattern: string,
  flags: Set<FlagKey>,
  input: string,
  replacement: string
): RegexReplaceResult | { error: string } {
  if (!pattern) {
    return {
      output: input,
      replacements: 0,
    };
  }

  let regex: RegExp;
  const flagString = [...flags].join("");

  try {
    regex = new RegExp(pattern, flagString);
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Invalid regular expression",
    };
  }

  const output = input.replace(regex, replacement);
  const replacements = countReplacements(pattern, flagString, input);

  return {
    output,
    replacements,
  };
}

function createSummary(matches: MatchResult[]): RegexSummary {
  return {
    captureGroupCount: matches.reduce((total, match) => total + match.groups.length, 0),
    emptyMatchCount: matches.filter((match) => match.fullMatch.length === 0).length,
    firstMatchIndex: matches[0]?.index ?? null,
  };
}

function countReplacements(pattern: string, flagString: string, input: string): number {
  const regex = new RegExp(pattern, flagString);

  if (!flagString.includes("g")) {
    return regex.test(input) ? 1 : 0;
  }

  let count = 0;
  let match: RegExpExecArray | null;
  let lastIndex = -1;

  while ((match = regex.exec(input)) !== null) {
    if (match.index === lastIndex) {
      regex.lastIndex += 1;
      continue;
    }

    lastIndex = match.index;
    count += 1;
  }

  return count;
}
