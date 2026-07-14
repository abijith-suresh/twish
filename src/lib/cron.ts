export type CronFieldName = "minute" | "hour" | "dayOfMonth" | "month" | "dayOfWeek";

export interface CronFieldRangeSpec {
  min: number;
  max: number;
  label: string;
}

/**
 * v1 supported cron subset for the parser/validator layer.
 *
 * - five fields only: minute hour day-of-month month day-of-week
 * - numeric values only
 * - supported operators: wildcard (*), lists (,), ranges (-), and steps (/)
 * - unsupported for now: aliases (JAN, MON), seconds field, macros (@daily), and special tokens (?, L, W, #)
 */
export const CRON_FIELD_SPECS: Record<CronFieldName, CronFieldRangeSpec> = {
  minute: { min: 0, max: 59, label: "Minute" },
  hour: { min: 0, max: 23, label: "Hour" },
  dayOfMonth: { min: 1, max: 31, label: "Day of month" },
  month: { min: 1, max: 12, label: "Month" },
  dayOfWeek: { min: 0, max: 6, label: "Day of week" },
};

export const SUPPORTED_CRON_SYNTAX = {
  fieldOrder: ["minute", "hour", "dayOfMonth", "month", "dayOfWeek"] as const,
  operators: ["*", ",", "-", "/"] as const,
  unsupported: ["aliases", "seconds", "macros", "?", "L", "W", "#"] as const,
};

export interface CronWildcardField {
  kind: "wildcard";
  raw: string;
}

export interface CronValueField {
  kind: "value";
  raw: string;
  value: number;
}

export interface CronRangeField {
  kind: "range";
  raw: string;
  start: number;
  end: number;
}

export type CronAtomicField = CronWildcardField | CronValueField | CronRangeField;

export interface CronStepField {
  kind: "step";
  raw: string;
  base: CronAtomicField;
  step: number;
}

export interface CronListField {
  kind: "list";
  raw: string;
  items: CronAtomicField[];
}

export type CronField = CronAtomicField | CronStepField | CronListField;

export interface CronExpression {
  minute: CronField;
  hour: CronField;
  dayOfMonth: CronField;
  month: CronField;
  dayOfWeek: CronField;
}

export interface CronParseError {
  field: CronFieldName | "expression";
  message: string;
}

export type CronParseResult =
  | { ok: true; value: CronExpression }
  | { ok: false; error: CronParseError };

type CronFieldParseResult = { ok: true; value: CronField } | { ok: false; error: CronParseError };
type CronAtomicParseResult =
  | { ok: true; value: CronAtomicField }
  | { ok: false; error: CronParseError };

function unsupportedSyntaxError(name: CronFieldName): { ok: false; error: CronParseError } {
  return {
    ok: false,
    error: {
      field: name,
      message: `${CRON_FIELD_SPECS[name].label} contains unsupported syntax.`,
    },
  };
}

function validateFieldValue(name: CronFieldName, value: number): CronParseError | null {
  const { min, max, label } = CRON_FIELD_SPECS[name];
  if (value < min || value > max) {
    return {
      field: name,
      message: `${label} must be between ${min} and ${max}.`,
    };
  }

  return null;
}

function parseAtomicField(name: CronFieldName, raw: string): CronAtomicParseResult {
  if (raw === "*") {
    return { ok: true, value: { kind: "wildcard", raw } };
  }

  if (/^\d+-\d+$/.test(raw)) {
    const [startText, endText] = raw.split("-");
    const start = Number.parseInt(startText, 10);
    const end = Number.parseInt(endText, 10);

    const startError = validateFieldValue(name, start);
    if (startError) {
      return { ok: false, error: startError };
    }

    const endError = validateFieldValue(name, end);
    if (endError) {
      return { ok: false, error: endError };
    }

    if (start > end) {
      return {
        ok: false,
        error: {
          field: name,
          message: `${CRON_FIELD_SPECS[name].label} range start must be less than or equal to the end.`,
        },
      };
    }

    return {
      ok: true,
      value: {
        kind: "range",
        raw,
        start,
        end,
      },
    };
  }

  if (!/^\d+$/.test(raw)) {
    return unsupportedSyntaxError(name);
  }

  const value = Number.parseInt(raw, 10);
  const validationError = validateFieldValue(name, value);
  if (validationError) {
    return {
      ok: false,
      error: validationError,
    };
  }

  return {
    ok: true,
    value: {
      kind: "value",
      raw,
      value,
    },
  };
}

function parseField(name: CronFieldName, raw: string): CronFieldParseResult {
  if (raw.includes(",")) {
    const itemResults = raw.split(",").map((part) => parseAtomicField(name, part));
    const firstError = itemResults.find((result) => !result.ok);
    if (firstError && !firstError.ok) {
      return firstError;
    }

    return {
      ok: true,
      value: {
        kind: "list",
        raw,
        items: itemResults.map((result) => {
          if (!result.ok) {
            throw new Error("Unexpected cron list parse failure.");
          }
          return result.value;
        }),
      },
    };
  }

  if (/^.+\/\d+$/.test(raw)) {
    const [baseRaw, stepRaw] = raw.split("/");
    const base = parseAtomicField(name, baseRaw);
    if (!base.ok) return base;

    const step = Number.parseInt(stepRaw, 10);
    if (step < 1) {
      return {
        ok: false,
        error: {
          field: name,
          message: `${CRON_FIELD_SPECS[name].label} step must be greater than 0.`,
        },
      };
    }

    return {
      ok: true,
      value: {
        kind: "step",
        raw,
        base: base.value,
        step,
      },
    };
  }

  return parseAtomicField(name, raw);
}

export function parseCronExpression(input: string): CronParseResult {
  const trimmed = input.trim();
  const parts = trimmed ? trimmed.split(/\s+/) : [];

  if (parts.length !== 5) {
    return {
      ok: false,
      error: {
        field: "expression",
        message: "Cron expressions must contain exactly five fields.",
      },
    };
  }

  const minute = parseField("minute", parts[0]);
  if (!minute.ok) return minute;

  const hour = parseField("hour", parts[1]);
  if (!hour.ok) return hour;

  const dayOfMonth = parseField("dayOfMonth", parts[2]);
  if (!dayOfMonth.ok) return dayOfMonth;

  const month = parseField("month", parts[3]);
  if (!month.ok) return month;

  const dayOfWeek = parseField("dayOfWeek", parts[4]);
  if (!dayOfWeek.ok) return dayOfWeek;

  return {
    ok: true,
    value: {
      minute: minute.value,
      hour: hour.value,
      dayOfMonth: dayOfMonth.value,
      month: month.value,
      dayOfWeek: dayOfWeek.value,
    },
  };
}
