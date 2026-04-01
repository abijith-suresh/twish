import { createMemo, createSignal, Show } from "solid-js";

import CopyButton from "@/components/CopyButton";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Convert a base64url string to standard base64 and decode it. */
function decodeBase64Url(str: string): unknown {
  // Replace base64url chars with standard base64 chars
  const base64 = str.replace(/-/g, "+").replace(/_/g, "/");
  // Pad to a multiple of 4
  const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);

  let decoded: string;
  try {
    decoded = atob(padded);
  } catch {
    throw new Error("Invalid base64url encoding");
  }

  // atob gives a binary string — decode as UTF-8 via percent-encoding trick
  const utf8 = decodeURIComponent(
    decoded
      .split("")
      .map((c) => "%" + c.charCodeAt(0).toString(16).padStart(2, "0"))
      .join("")
  );

  try {
    return JSON.parse(utf8) as unknown;
  } catch {
    // Non-JSON payload: return the raw string
    return utf8;
  }
}

interface ParsedJwt {
  header: unknown;
  payload: unknown;
  signature: string;
}

/** Parse a JWT string into its three parts, or return null on failure. */
function parseJwt(token: string): ParsedJwt | null {
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

/** Pretty-print any value as JSON (2-space indent). */
function prettyJson(value: unknown): string {
  return JSON.stringify(value, null, 2);
}

/** Format a Unix timestamp (seconds) into a locale date+time string. */
function formatExp(exp: number): string {
  return new Date(exp * 1000).toLocaleString();
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

interface PanelProps {
  title: string;
  content: string;
}

function Panel(props: PanelProps) {
  return (
    <div
      style={{
        background: "var(--bg-secondary)",
        border: "1px solid var(--border)",
        "border-radius": "0.5rem",
        overflow: "hidden",
      }}
    >
      {/* Panel header */}
      <div
        style={{
          display: "flex",
          "align-items": "center",
          "justify-content": "space-between",
          padding: "0.625rem 1rem",
          "border-bottom": "1px solid var(--border)",
        }}
      >
        <span
          style={{
            "font-size": "0.75rem",
            "font-weight": "600",
            "letter-spacing": "0.05em",
            "text-transform": "uppercase",
            color: "var(--text-secondary)",
          }}
        >
          {props.title}
        </span>
        <CopyButton text={props.content} />
      </div>

      {/* Panel body */}
      <pre
        style={{
          margin: "0",
          padding: "1rem",
          "overflow-x": "auto",
          "font-size": "0.8125rem",
          "line-height": "1.6",
          color: "var(--text-primary)",
          "font-family": "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
          "white-space": "pre-wrap",
          "word-break": "break-all",
        }}
      >
        <code>{props.content}</code>
      </pre>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function JwtDecoder() {
  const [input, setInput] = createSignal("");

  const parsed = createMemo((): ParsedJwt | null => {
    const raw = input().trim();
    if (!raw) return null;
    return parseJwt(raw);
  });

  const error = createMemo((): string | null => {
    const raw = input().trim();
    if (!raw) return null;
    if (parsed() === null) return "Invalid JWT — expected three base64url parts separated by dots.";
    return null;
  });

  /** Expiry status derived from the payload's `exp` claim. */
  const expiryStatus = createMemo((): { expired: boolean; label: string } | null => {
    const result = parsed();
    if (!result) return null;

    const payload = result.payload;
    if (typeof payload !== "object" || payload === null) return null;

    const exp = (payload as Record<string, unknown>)["exp"];
    if (typeof exp !== "number") return null;

    const now = Math.floor(Date.now() / 1000);
    const expired = now > exp;
    return {
      expired,
      label: expired ? `Token expired — ${formatExp(exp)}` : `Valid until ${formatExp(exp)}`,
    };
  });

  return (
    <div
      style={{
        display: "flex",
        "flex-direction": "column",
        gap: "1.25rem",
        padding: "1.5rem",
        "max-width": "860px",
        margin: "0 auto",
        width: "100%",
      }}
    >
      {/* ------------------------------------------------------------------ */}
      {/* Input area                                                          */}
      {/* ------------------------------------------------------------------ */}
      <div
        style={{
          display: "flex",
          "flex-direction": "column",
          gap: "0.5rem",
        }}
      >
        <textarea
          value={input()}
          onInput={(e) => setInput(e.currentTarget.value)}
          placeholder="Paste a JWT token here..."
          rows={5}
          spellcheck={false}
          style={{
            width: "100%",
            padding: "0.875rem 1rem",
            "border-radius": "0.5rem",
            border: "1px solid var(--border)",
            background: "var(--bg-secondary)",
            color: "var(--text-primary)",
            "font-family": "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
            "font-size": "0.875rem",
            "line-height": "1.6",
            resize: "vertical",
            outline: "none",
            "box-sizing": "border-box",
          }}
        />

        {/* Hint — only when input is empty */}
        <Show when={!input().trim()}>
          <p
            style={{
              "font-size": "0.8125rem",
              color: "var(--text-muted)",
              margin: "0",
            }}
          >
            Supports RS256, HS256, and all standard JWT algorithms
          </p>
        </Show>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Error banner                                                        */}
      {/* ------------------------------------------------------------------ */}
      <Show when={error()}>
        <div
          role="alert"
          style={{
            padding: "0.75rem 1rem",
            "border-radius": "0.5rem",
            border: "1px solid var(--accent-error)",
            background: "color-mix(in srgb, var(--accent-error) 12%, transparent)",
            color: "var(--accent-error)",
            "font-size": "0.875rem",
          }}
        >
          {error()}
        </div>
      </Show>

      {/* ------------------------------------------------------------------ */}
      {/* Output panels (only when valid JWT)                                */}
      {/* ------------------------------------------------------------------ */}
      <Show when={parsed()}>
        {(result) => (
          <>
            {/* Expiry badge */}
            <Show when={expiryStatus()}>
              {(status) => (
                <div
                  style={{
                    display: "inline-flex",
                    "align-self": "flex-start",
                    "align-items": "center",
                    gap: "0.375rem",
                    padding: "0.375rem 0.75rem",
                    "border-radius": "9999px",
                    "font-size": "0.8125rem",
                    "font-weight": "500",
                    border: `1px solid ${status().expired ? "var(--accent-error)" : "var(--accent-success)"}`,
                    background: status().expired
                      ? "color-mix(in srgb, var(--accent-error) 12%, transparent)"
                      : "color-mix(in srgb, var(--accent-success) 12%, transparent)",
                    color: status().expired ? "var(--accent-error)" : "var(--accent-success)",
                  }}
                >
                  <span
                    style={{
                      width: "6px",
                      height: "6px",
                      "border-radius": "50%",
                      background: "currentColor",
                      display: "inline-block",
                      "flex-shrink": "0",
                    }}
                  />
                  {status().label}
                </div>
              )}
            </Show>

            {/* Header panel */}
            <Panel title="Header" content={prettyJson(result().header)} />

            {/* Payload panel */}
            <Panel title="Payload" content={prettyJson(result().payload)} />

            {/* Signature panel */}
            <Panel title="Signature" content={result().signature} />
          </>
        )}
      </Show>
    </div>
  );
}
