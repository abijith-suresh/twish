import { createMemo, createSignal, Show } from "solid-js";

import CopyButton from "@/components/CopyButton";
import { formatJson, type IndentSize, type JsonFormatResult } from "@/lib/jsonFormatter";

export default function JsonFormatter() {
  const [input, setInput] = createSignal("");
  const [indent, setIndent] = createSignal<IndentSize>(2);
  const [minify, setMinify] = createSignal(false);
  const result = createMemo((): JsonFormatResult => formatJson(input(), indent(), minify()));

  const tabStyle = (active: boolean) => ({
    padding: "0.25rem 0.625rem",
    "border-radius": "0.25rem",
    "font-size": "0.75rem",
    "font-weight": "600",
    cursor: "pointer",
    border: "none",
    background: active ? "var(--accent-primary)" : "transparent",
    color: active ? "var(--bg-primary)" : "var(--text-secondary)",
    transition: "background 0.15s, color 0.15s",
  });

  return (
    <div
      style={{
        display: "flex",
        "flex-direction": "column",
        gap: "1.25rem",
        padding: "1.5rem",
        "max-width": "900px",
        margin: "0 auto",
        width: "100%",
      }}
    >
      <div
        style={{
          display: "flex",
          "align-items": "center",
          "flex-wrap": "wrap",
          gap: "0.75rem",
        }}
      >
        <div
          style={{
            display: "flex",
            "align-items": "center",
            gap: "0.25rem",
            padding: "0.25rem",
            background: "var(--bg-secondary)",
            border: "1px solid var(--border)",
            "border-radius": "0.375rem",
          }}
        >
          <button
            style={tabStyle(indent() === 2 && !minify())}
            onClick={() => {
              setIndent(2);
              setMinify(false);
            }}
          >
            2 spaces
          </button>
          <button
            style={tabStyle(indent() === 4 && !minify())}
            onClick={() => {
              setIndent(4);
              setMinify(false);
            }}
          >
            4 spaces
          </button>
        </div>

        <button
          style={{
            padding: "0.25rem 0.75rem",
            "border-radius": "0.375rem",
            border: `1px solid ${minify() ? "var(--accent-primary)" : "var(--border)"}`,
            background: minify()
              ? "color-mix(in srgb, var(--accent-primary) 15%, transparent)"
              : "var(--bg-secondary)",
            color: minify() ? "var(--accent-primary)" : "var(--text-secondary)",
            "font-size": "0.75rem",
            "font-weight": "600",
            cursor: "pointer",
          }}
          onClick={() => setMinify((value) => !value)}
        >
          Minify
        </button>

        <Show when={input().trim()}>
          <button
            style={{
              "margin-left": "auto",
              padding: "0.25rem 0.75rem",
              "border-radius": "0.375rem",
              border: "1px solid var(--border)",
              background: "var(--bg-secondary)",
              color: "var(--text-muted)",
              "font-size": "0.75rem",
              cursor: "pointer",
            }}
            onClick={() => setInput("")}
          >
            Clear
          </button>
        </Show>
      </div>

      <div style={{ display: "flex", "flex-direction": "column", gap: "0.375rem" }}>
        <label
          style={{
            "font-size": "0.75rem",
            "font-weight": "600",
            "letter-spacing": "0.05em",
            "text-transform": "uppercase",
            color: "var(--text-secondary)",
          }}
        >
          Input JSON
        </label>
        <textarea
          value={input()}
          onInput={(e) => setInput(e.currentTarget.value)}
          placeholder="Paste JSON here…"
          rows={10}
          autofocus
          spellcheck={false}
          style={{
            width: "100%",
            padding: "0.875rem 1rem",
            "border-radius": "0.5rem",
            border: `1px solid ${result().error ? "var(--accent-error)" : "var(--border)"}`,
            background: "var(--bg-secondary)",
            color: "var(--text-primary)",
            "font-family": "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
            "font-size": "0.875rem",
            "line-height": "1.6",
            resize: "vertical",
            outline: "none",
            "box-sizing": "border-box",
            transition: "border-color 0.15s",
          }}
        />
      </div>

      <Show when={result().error}>
        {(msg) => (
          <div
            role="alert"
            style={{
              padding: "0.75rem 1rem",
              "border-radius": "0.5rem",
              border: "1px solid var(--accent-error)",
              background: "color-mix(in srgb, var(--accent-error) 12%, transparent)",
              color: "var(--accent-error)",
              "font-size": "0.875rem",
              "font-family": "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
            }}
          >
            {msg()}
          </div>
        )}
      </Show>

      <Show when={result().html}>
        {(html) => (
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
                {minify() ? "Minified" : `Formatted · ${indent()} spaces`}
              </span>
              <CopyButton text={result().raw} />
            </div>

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
              innerHTML={html()}
            />
          </div>
        )}
      </Show>
    </div>
  );
}
