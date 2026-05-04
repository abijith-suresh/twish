import { createMemo, createSignal, Show } from "solid-js";

import CopyButton from "@/components/CopyButton";
import { getJwtClaimsSummary, getJwtExpiryStatus, parseJwt, prettyJson } from "@/lib/jwt";

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
          "font-family": "var(--font-mono)",
          "font-size": "0.8125rem",
          "line-height": "1.6",
          color: "var(--text-primary)",
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

  const parsed = createMemo(() => {
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

  const claimsSummary = createMemo(() => {
    const result = parsed();
    return result ? getJwtClaimsSummary(result) : [];
  });

  /** Expiry status derived from the payload's `exp` claim. */
  const expiryStatus = createMemo(() => {
    const result = parsed();
    if (!result) return null;

    return getJwtExpiryStatus(result.payload);
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
            "font-family": "var(--font-mono)",
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

            <Show when={claimsSummary().length > 0}>
              <div
                style={{
                  background: "var(--bg-secondary)",
                  border: "1px solid var(--border)",
                  "border-radius": "0.5rem",
                  overflow: "hidden",
                }}
              >
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
                    Claims summary
                  </span>
                </div>
                <div
                  style={{
                    display: "grid",
                    "grid-template-columns": "repeat(auto-fit, minmax(220px, 1fr))",
                    gap: "0.75rem",
                    padding: "1rem",
                  }}
                >
                  {claimsSummary().map((item) => (
                    <div
                      style={{
                        display: "flex",
                        "flex-direction": "column",
                        gap: "0.25rem",
                        padding: "0.75rem",
                        background: "var(--bg-primary)",
                        border: "1px solid var(--border)",
                        "border-radius": "0.375rem",
                      }}
                    >
                      <span
                        style={{
                          "font-size": "0.6875rem",
                          "font-weight": "700",
                          "letter-spacing": "0.06em",
                          "text-transform": "uppercase",
                          color: "var(--text-muted)",
                        }}
                      >
                        {item.section} · {item.label}
                      </span>
                      <code
                        style={{
                          color: "var(--text-primary)",
                          "font-size": "0.8125rem",
                          "font-family": "var(--font-mono)",
                          "word-break": "break-word",
                        }}
                      >
                        {item.displayValue}
                      </code>
                      <Show when={item.displayValue !== item.rawValue}>
                        <span
                          style={{
                            color: "var(--text-secondary)",
                            "font-size": "0.75rem",
                            "font-family": "var(--font-mono)",
                            "word-break": "break-word",
                          }}
                        >
                          raw: {item.rawValue}
                        </span>
                      </Show>
                    </div>
                  ))}
                </div>
              </div>
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
