import { parse as parseToml, stringify as stringifyToml } from "@iarna/toml";
import type { JsonMap as TomlTable } from "@iarna/toml";
import { parseAllDocuments, stringify } from "yaml";

type JsonValue = null | boolean | number | string | JsonValue[] | { [key: string]: JsonValue };

export interface StructuredCompareError {
  side: "left" | "right";
  message: string;
}

export interface StructuredCompareResult {
  original: string;
  modified: string;
  strategy: "text" | "json" | "toml" | "yaml" | "env";
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
type NormalizeYamlResult = NormalizeJsonResult;
type NormalizeEnvResult = NormalizeJsonResult;
type NormalizeTomlResult = NormalizeJsonResult;

function parseEnvKeyAndValue(line: string): { key: string; value: string } {
  const trimmedLine = line.trim();

  if (trimmedLine.length === 0 || trimmedLine.startsWith("#")) {
    throw new Error(`Invalid env entry: ${line}`);
  }

  const withoutExport = trimmedLine.startsWith("export ")
    ? trimmedLine.slice(7).trimStart()
    : trimmedLine;
  const equalsIndex = withoutExport.indexOf("=");

  if (equalsIndex === -1) {
    throw new Error(`Invalid env entry: ${line}`);
  }

  const key = withoutExport.slice(0, equalsIndex).trim();

  if (!/^[A-Za-z_][A-Za-z0-9_.-]*$/.test(key)) {
    throw new Error(`Invalid env key: ${key}`);
  }

  return {
    key,
    value: withoutExport.slice(equalsIndex + 1),
  };
}

function parseEnvRecord(input: string): Record<string, string> {
  const normalizedInput = input.replace(/\r\n?/g, "\n");
  const values: Record<string, string> = {};
  const lines = normalizedInput.split("\n");

  for (let index = 0; index < lines.length; index++) {
    const line = lines[index];
    const trimmedLine = line.trim();

    if (trimmedLine.length === 0 || trimmedLine.startsWith("#")) {
      continue;
    }

    const { key, value: rawValue } = parseEnvKeyAndValue(line);
    const trimmedValue = rawValue.trim();
    const openingQuote = trimmedValue[0];

    if (openingQuote === '"' || openingQuote === "'" || openingQuote === "`") {
      let buffer = "";
      let remainder = trimmedValue.slice(1);
      let closed = false;

      while (true) {
        let escaped = false;

        for (let charIndex = 0; charIndex < remainder.length; charIndex++) {
          const character = remainder[charIndex];

          if (escaped) {
            buffer += character;
            escaped = false;
            continue;
          }

          if (character === "\\") {
            buffer += character;
            escaped = true;
            continue;
          }

          if (character === openingQuote) {
            const trailing = remainder.slice(charIndex + 1).trim();

            if (trailing.length > 0 && !trailing.startsWith("#")) {
              throw new Error(`Invalid env entry: ${line}`);
            }

            closed = true;
            break;
          }

          buffer += character;
        }

        if (closed) {
          values[key] =
            openingQuote === '"' ? buffer.replace(/\\n/g, "\n").replace(/\\r/g, "\r") : buffer;
          break;
        }

        index += 1;

        if (index >= lines.length) {
          throw new Error("Unterminated quoted env value");
        }

        buffer += "\n";
        remainder = lines[index];
      }

      continue;
    }

    if (trimmedValue.length === 0 || trimmedValue.startsWith("#")) {
      values[key] = "";
      continue;
    }

    const inlineCommentIndex = trimmedValue.search(/\s#/);
    values[key] =
      inlineCommentIndex === -1
        ? trimmedValue
        : trimmedValue.slice(0, inlineCommentIndex).trimEnd();
  }

  return values;
}

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

function sortTomlUnknown(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(sortTomlUnknown);
  }

  if (typeof value === "object" && value !== null && !(value instanceof Date)) {
    return Object.keys(value)
      .sort((leftKey, rightKey) => leftKey.localeCompare(rightKey))
      .reduce<Record<string, unknown>>((acc, key) => {
        acc[key] = sortTomlUnknown((value as Record<string, unknown>)[key]);
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

export function normalizeYamlForDiff(input: string): NormalizeYamlResult {
  if (input.trim().length === 0) {
    return { ok: true, output: "" };
  }

  try {
    const documents = parseAllDocuments(input);

    for (const document of documents) {
      if (document.errors.length > 0) {
        throw document.errors[0];
      }
    }

    const normalizedDocuments = documents.map((document) => {
      const parsed = document.toJS() as JsonValue;
      const sorted = sortJsonValue(parsed);
      return stringify(sorted, {
        defaultStringType: "PLAIN",
        sortMapEntries: true,
      }).trimEnd();
    });

    return {
      ok: true,
      output: normalizedDocuments.join("\n---\n"),
    };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Invalid YAML input",
    };
  }
}

export function normalizeTomlForDiff(input: string): NormalizeTomlResult {
  if (input.trim().length === 0) {
    return { ok: true, output: "" };
  }

  try {
    const parsed = parseToml(input) as TomlTable;
    const sorted = sortTomlUnknown(parsed) as TomlTable;

    return {
      ok: true,
      output: stringifyToml(sorted as TomlTable)
        .replace(/\r\n?/g, "\n")
        .trimEnd(),
    };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Invalid TOML input",
    };
  }
}

export function normalizeEnvForDiff(input: string): NormalizeEnvResult {
  if (input.trim().length === 0) {
    return { ok: true, output: "" };
  }

  try {
    const parsed = parseEnvRecord(input);

    const output = Object.entries(parsed)
      .sort(([leftKey], [rightKey]) => leftKey.localeCompare(rightKey))
      .map(([key, value]) => `${key}=${value}`)
      .join("\n");

    return { ok: true, output };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Invalid env input",
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
    if (leftLanguage === "env" && rightLanguage === "env") {
      const left = normalizeEnvForDiff(original);
      const right = normalizeEnvForDiff(modified);

      if (left.ok && right.ok) {
        return {
          original: left.output,
          modified: right.output,
          strategy: "env",
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

    if (leftLanguage === "yaml" && rightLanguage === "yaml") {
      const left = normalizeYamlForDiff(original);
      const right = normalizeYamlForDiff(modified);

      if (left.ok && right.ok) {
        return {
          original: left.output,
          modified: right.output,
          strategy: "yaml",
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

    if (leftLanguage === "toml" && rightLanguage === "toml") {
      const left = normalizeTomlForDiff(original);
      const right = normalizeTomlForDiff(modified);

      if (left.ok && right.ok) {
        return {
          original: left.output,
          modified: right.output,
          strategy: "toml",
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
