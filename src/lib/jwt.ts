export interface ParsedJwt {
  header: unknown;
  payload: unknown;
  signature: string;
}

export interface JwtExpiryStatus {
  expired: boolean;
  label: string;
}

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

export function formatJwtExpiry(exp: number): string {
  return new Date(exp * 1000).toLocaleString();
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
      ? `Token expired — ${formatJwtExpiry(exp)}`
      : `Valid until ${formatJwtExpiry(exp)}`,
  };
}
