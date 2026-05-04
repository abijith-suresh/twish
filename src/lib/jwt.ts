export interface ParsedJwt {
  header: unknown;
  payload: unknown;
  signature: string;
}

export interface JwtExpiryStatus {
  expired: boolean;
  label: string;
}

export type RegisteredJwtClaimKey =
  | "alg"
  | "typ"
  | "iss"
  | "sub"
  | "aud"
  | "exp"
  | "nbf"
  | "iat"
  | "jti";

export interface JwtClaimSummaryItem {
  key: RegisteredJwtClaimKey;
  label: string;
  rawValue: string;
  displayValue: string;
  section: "header" | "payload";
}

const REGISTERED_CLAIMS: Array<{
  key: RegisteredJwtClaimKey;
  label: string;
  section: "header" | "payload";
}> = [
  { key: "alg", label: "Algorithm", section: "header" },
  { key: "typ", label: "Type", section: "header" },
  { key: "iss", label: "Issuer", section: "payload" },
  { key: "sub", label: "Subject", section: "payload" },
  { key: "aud", label: "Audience", section: "payload" },
  { key: "exp", label: "Expires", section: "payload" },
  { key: "nbf", label: "Not before", section: "payload" },
  { key: "iat", label: "Issued at", section: "payload" },
  { key: "jti", label: "JWT ID", section: "payload" },
];

export function decodeBase64Url(str: string): unknown {
  const base64 = str.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);

  let decoded: string;
  try {
    decoded = atob(padded);
  } catch {
    throw new Error("Invalid base64url encoding");
  }

  const utf8 = decodeURIComponent(
    decoded
      .split("")
      .map((c) => "%" + c.charCodeAt(0).toString(16).padStart(2, "0"))
      .join("")
  );

  try {
    return JSON.parse(utf8) as unknown;
  } catch {
    return utf8;
  }
}

export function parseJwt(token: string): ParsedJwt | null {
  const parts = token.trim().split(".");
  if (parts.length !== 3) return null;

  const [rawHeader, rawPayload, signature] = parts;

  try {
    const header = decodeBase64Url(rawHeader);
    const payload = decodeBase64Url(rawPayload);
    return { header, payload, signature };
  } catch {
    return null;
  }
}

export function prettyJson(value: unknown): string {
  return JSON.stringify(value, null, 2);
}

export function formatJwtTimestamp(value: number): string {
  return new Date(value * 1000).toLocaleString();
}

function stringifyJwtClaimValue(value: unknown): string {
  if (typeof value === "string") {
    return value;
  }

  return JSON.stringify(value);
}

function getClaimContainer(
  parsed: ParsedJwt,
  section: "header" | "payload"
): Record<string, unknown> | null {
  const value = parsed[section];
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return null;
  }

  return value as Record<string, unknown>;
}

function humanizeRegisteredClaim(key: RegisteredJwtClaimKey, value: unknown): string {
  if (["exp", "nbf", "iat"].includes(key) && typeof value === "number") {
    return formatJwtTimestamp(value);
  }

  if (Array.isArray(value)) {
    return value.map((entry) => stringifyJwtClaimValue(entry)).join(", ");
  }

  return stringifyJwtClaimValue(value);
}

export function getJwtClaimsSummary(parsed: ParsedJwt): JwtClaimSummaryItem[] {
  return REGISTERED_CLAIMS.flatMap((claim) => {
    const container = getClaimContainer(parsed, claim.section);
    if (!container || !(claim.key in container)) {
      return [];
    }

    const value = container[claim.key];
    return [
      {
        key: claim.key,
        label: claim.label,
        rawValue: stringifyJwtClaimValue(value),
        displayValue: humanizeRegisteredClaim(claim.key, value),
        section: claim.section,
      },
    ];
  });
}

export function getJwtExpiryStatus(
  payload: unknown,
  nowSeconds: number = Math.floor(Date.now() / 1000)
): JwtExpiryStatus | null {
  if (typeof payload !== "object" || payload === null) return null;

  const exp = (payload as Record<string, unknown>)["exp"];
  if (typeof exp !== "number") return null;

  const expired = nowSeconds > exp;
  return {
    expired,
    label: expired
      ? `Token expired — ${formatJwtTimestamp(exp)}`
      : `Valid until ${formatJwtTimestamp(exp)}`,
  };
}
