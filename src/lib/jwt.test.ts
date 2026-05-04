import { describe, expect, it } from "vitest";

import {
  decodeBase64Url,
  formatJwtTimestamp,
  getJwtClaimsSummary,
  getJwtExpiryStatus,
  parseJwt,
  prettyJson,
} from "./jwt";

describe("jwt utilities", () => {
  it("decodes base64url JSON payloads", () => {
    expect(decodeBase64Url("eyJmb28iOiJiYXIifQ")).toEqual({ foo: "bar" });
  });

  it("parses JWT tokens into header, payload, and signature", () => {
    const token =
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjMiLCJleHAiOjE5MDAwMDAwMDB9.signature";

    expect(parseJwt(token)).toEqual({
      header: { alg: "HS256", typ: "JWT" },
      payload: { sub: "123", exp: 1900000000 },
      signature: "signature",
    });
  });

  it("returns null for invalid JWT shapes", () => {
    expect(parseJwt("not.a.jwt.extra")).toBeNull();
  });

  it("derives token expiry state from exp claims", () => {
    expect(getJwtExpiryStatus({ exp: 100 }, 200)?.expired).toBe(true);
    expect(getJwtExpiryStatus({ exp: 300 }, 200)?.expired).toBe(false);
    expect(getJwtExpiryStatus({ sub: "123" }, 200)).toBeNull();
  });

  it("formats registered timestamp claims predictably", () => {
    expect(formatJwtTimestamp(1_900_000_000)).toContain("2030");
  });

  it("extracts standard claims into a compact summary", () => {
    const summary = getJwtClaimsSummary({
      header: { alg: "HS256", typ: "JWT" },
      payload: {
        iss: "issuer",
        sub: "123",
        aud: ["web", "mobile"],
        exp: 1_900_000_000,
        iat: 1_800_000_000,
        jti: "token-id",
      },
      signature: "signature",
    });

    expect(summary.map((item) => item.key)).toEqual([
      "alg",
      "typ",
      "iss",
      "sub",
      "aud",
      "exp",
      "iat",
      "jti",
    ]);
    expect(summary.find((item) => item.key === "aud")?.rawValue).toBe('["web","mobile"]');
    expect(summary.find((item) => item.key === "exp")?.displayValue).toContain("2030");
    expect(summary.find((item) => item.key === "alg")?.section).toBe("header");
    expect(summary.find((item) => item.key === "sub")?.section).toBe("payload");
  });

  it("pretty prints arbitrary values", () => {
    expect(prettyJson({ foo: "bar" })).toBe(`{
  "foo": "bar"
}`);
  });
});
