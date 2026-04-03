import { describe, expect, it } from "vitest";

import { decodeBase64Url, getJwtExpiryStatus, parseJwt, prettyJson } from "./jwt";

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

  it("pretty prints arbitrary values", () => {
    expect(prettyJson({ foo: "bar" })).toBe(`{
  "foo": "bar"
}`);
  });
});
