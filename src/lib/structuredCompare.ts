type JsonValue = null | boolean | number | string | JsonValue[] | { [key: string]: JsonValue };

export interface StructuredCompareError {
  side: "left" | "right";
  message: string;
}

export interface StructuredCompareResult {
  original: string;
  modified: string;
  strategy: "text" | "json";
  errors: StructuredCompareError[];
}

interface NormalizeJsonSuccess {
  ok: true;
  output: string;
}

interface NormalizeJsonFailure {
  ok: false;
  message: string;
}

type NormalizeJsonResult = NormalizeJsonSuccess | NormalizeJsonFailure;

function isPlainObject(value: JsonValue): value is { [key: string]: JsonValue } {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function sortJsonValue(value: JsonValue): JsonValue {
  if (Array.isArray(value)) {
    return value.map(sortJsonValue);
  }

  if (isPlainObject(value)) {
    return Object.keys(value)
      .sort((leftKey, rightKey) => leftKey.localeCompare(rightKey))
      .reduce<{ [key: string]: JsonValue }>((acc, key) => {
        acc[key] = sortJsonValue(value[key]);
        return acc;
      }, {});
  }

  return value;
}

export function normalizeJsonForDiff(input: string): NormalizeJsonResult {
  if (input.trim().length === 0) {
    return { ok: true, output: "" };
  }

  try {
    const parsed = JSON.parse(input) as JsonValue;
    const sorted = sortJsonValue(parsed);
    return { ok: true, output: JSON.stringify(sorted, null, 2) };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Invalid JSON input",
    };
  }
}

export function prepareStructuredCompare(input: {
  original: string;
  modified: string;
  leftLanguage: string;
  rightLanguage: string;
}): StructuredCompareResult {
  const { original, modified, leftLanguage, rightLanguage } = input;

  if (leftLanguage !== "json" || rightLanguage !== "json") {
    return {
      original,
      modified,
      strategy: "text",
      errors: [],
    };
  }

  const left = normalizeJsonForDiff(original);
  const right = normalizeJsonForDiff(modified);

  if (left.ok && right.ok) {
    return {
      original: left.output,
      modified: right.output,
      strategy: "json",
      errors: [],
    };
  }

  const errors: StructuredCompareError[] = [];

  if (!left.ok) {
    errors.push({ side: "left", message: left.message });
  }

  if (!right.ok) {
    errors.push({ side: "right", message: right.message });
  }

  return {
    original,
    modified,
    strategy: "text",
    errors,
  };
}
