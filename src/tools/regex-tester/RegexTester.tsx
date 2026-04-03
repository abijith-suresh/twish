import { createMemo, createSignal, For, Show } from "solid-js";

import CopyButton from "@/components/CopyButton";
import { buildRegexResult, type FlagKey, type MatchResult } from "@/lib/regex";

interface Flag {
  key: FlagKey;
  label: string;
  title: string;
}

const ALL_FLAGS: Flag[] = [
  { key: "g", label: "g", title: "Global — find all matches" },
  { key: "i", label: "i", title: "Case-insensitive" },
  { key: "m", label: "m", title: "Multiline — ^ and $ match line boundaries" },
  { key: "s", label: "s", title: "Dot-all — . matches newlines" },
];

export default function RegexTester() {
  const [pattern, setPattern] = createSignal("");
  const [flags, setFlags] = createSignal<Set<FlagKey>>(new Set(["g"]));
  const [input, setInput] = createSignal("");

  function toggleFlag(key: FlagKey) {
    setFlags((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  }

  const result = createMemo(() => buildRegexResult(pattern(), flags(), input()));
  const matchCount = createMemo(() => result().matches.length);

  const namedGroupNames = createMemo((): string[] => {
    const names = new Set<string>();
    for (const match of result().matches) {
      for (const group of match.groups) {
        if (group.name) names.add(group.name);
      }
    }
    return [...names];
  });

  const hasCaptures = createMemo(() => result().matches.some((match) => match.groups.length > 0));

  const labelStyle = {
    "font-size": "0.75rem",
    "font-weight": "600" as const,
    "letter-spacing": "0.05em",
    "text-transform": "uppercase" as const,
    color: "var(--text-secondary)",
  };

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
      <div style={{ display: "flex", "flex-direction": "column", gap: "0.5rem" }}>
        <label style={labelStyle}>Pattern</label>
        <div
          style={{
            display: "flex",
            "align-items": "center",
            background: "var(--bg-secondary)",
            border: `1px solid ${result().error ? "var(--accent-error)" : "var(--border)"}`,
            "border-radius": "0.5rem",
            overflow: "hidden",
            transition: "border-color 0.15s",
          }}
        >
          <span
            style={{
              padding: "0 0.5rem 0 0.875rem",
              color: "var(--text-muted)",
              "font-family": "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
              "font-size": "1.125rem",
              "user-select": "none",
            }}
          >
            /
          </span>

          <input
            type="text"
            value={pattern()}
            onInput={(e) => setPattern(e.currentTarget.value)}
            placeholder="pattern"
            spellcheck={false}
            style={{
              flex: "1",
              padding: "0.625rem 0",
              background: "transparent",
              border: "none",
              outline: "none",
              color: "var(--text-primary)",
              "font-family": "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
              "font-size": "0.9375rem",
            }}
          />

          <span
            style={{
              color: "var(--text-muted)",
              "font-family": "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
              "font-size": "1.125rem",
              "user-select": "none",
            }}
          >
            /
          </span>

          <div
            style={{
              display: "flex",
              "align-items": "center",
              gap: "0.125rem",
              padding: "0 0.75rem",
            }}
          >
            <For each={ALL_FLAGS}>
              {(flag) => (
                <button
                  title={flag.title}
                  onClick={() => toggleFlag(flag.key)}
                  style={{
                    padding: "0.125rem 0.375rem",
                    "border-radius": "0.25rem",
                    border: "none",
                    background: flags().has(flag.key) ? "var(--accent-primary)" : "transparent",
                    color: flags().has(flag.key) ? "var(--bg-primary)" : "var(--text-muted)",
                    "font-family":
                      "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
                    "font-size": "0.875rem",
                    "font-weight": "700",
                    cursor: "pointer",
                    transition: "background 0.1s, color 0.1s",
                  }}
                >
                  {flag.label}
                </button>
              )}
            </For>
          </div>
        </div>
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

      <div style={{ display: "flex", "flex-direction": "column", gap: "0.375rem" }}>
        <label style={labelStyle}>Test string</label>
        <textarea
          value={input()}
          onInput={(e) => setInput(e.currentTarget.value)}
          placeholder="Enter text to test against the pattern…"
          rows={6}
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
      </div>

      <Show when={input().trim()}>
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
              padding: "0.5rem 1rem",
              "border-bottom": "1px solid var(--border)",
            }}
          >
            <span style={labelStyle}>Matches</span>
            <Show
              when={pattern() && !result().error}
              fallback={
                <span style={{ "font-size": "0.8125rem", color: "var(--text-muted)" }}>—</span>
              }
            >
              <span
                style={{
                  "font-size": "0.8125rem",
                  "font-weight": "600",
                  color: matchCount() > 0 ? "var(--accent-success)" : "var(--text-muted)",
                }}
              >
                {matchCount() === 0
                  ? "No matches"
                  : matchCount() === 1
                    ? "1 match"
                    : `${matchCount()} matches`}
              </span>
            </Show>
          </div>

          <pre
            style={{
              margin: "0",
              padding: "1rem",
              "overflow-x": "auto",
              "font-size": "0.875rem",
              "line-height": "1.8",
              color: "var(--text-primary)",
              "font-family": "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
              "white-space": "pre-wrap",
              "word-break": "break-all",
            }}
            innerHTML={result().highlighted}
          />
        </div>
      </Show>

      <Show when={hasCaptures() && matchCount() > 0}>
        <div
          style={{
            background: "var(--bg-secondary)",
            border: "1px solid var(--border)",
            "border-radius": "0.5rem",
            overflow: "hidden",
          }}
        >
          <div style={{ padding: "0.5rem 1rem", "border-bottom": "1px solid var(--border)" }}>
            <span style={labelStyle}>Capture groups</span>
          </div>

          <div style={{ overflow: "auto" }}>
            <table
              style={{
                width: "100%",
                "border-collapse": "collapse",
                "font-size": "0.8125rem",
                "font-family": "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
              }}
            >
              <thead>
                <tr>
                  <th
                    style={{
                      padding: "0.5rem 1rem",
                      "text-align": "left",
                      color: "var(--text-muted)",
                      "font-weight": "600",
                      "border-bottom": "1px solid var(--border)",
                      "white-space": "nowrap",
                    }}
                  >
                    Match #
                  </th>
                  <th
                    style={{
                      padding: "0.5rem 1rem",
                      "text-align": "left",
                      color: "var(--text-muted)",
                      "font-weight": "600",
                      "border-bottom": "1px solid var(--border)",
                    }}
                  >
                    Full match
                  </th>
                  <Show when={namedGroupNames().length > 0}>
                    <For each={namedGroupNames()}>
                      {(name) => (
                        <th
                          style={{
                            padding: "0.5rem 1rem",
                            "text-align": "left",
                            color: "var(--accent-primary)",
                            "font-weight": "600",
                            "border-bottom": "1px solid var(--border)",
                            "white-space": "nowrap",
                          }}
                        >
                          {name}
                        </th>
                      )}
                    </For>
                  </Show>
                  <Show
                    when={result().matches.some((match) =>
                      match.groups.some((group) => group.name === null)
                    )}
                  >
                    <th
                      style={{
                        padding: "0.5rem 1rem",
                        "text-align": "left",
                        color: "var(--text-muted)",
                        "font-weight": "600",
                        "border-bottom": "1px solid var(--border)",
                      }}
                    >
                      Groups
                    </th>
                  </Show>
                </tr>
              </thead>
              <tbody>
                <For each={result().matches}>
                  {(match: MatchResult, index) => (
                    <tr>
                      <td
                        style={{
                          padding: "0.375rem 1rem",
                          color: "var(--text-muted)",
                          "border-bottom": "1px solid var(--border)",
                          "white-space": "nowrap",
                        }}
                      >
                        {index() + 1}
                      </td>
                      <td
                        style={{
                          padding: "0.375rem 1rem",
                          color: "var(--text-primary)",
                          "border-bottom": "1px solid var(--border)",
                          "max-width": "200px",
                          overflow: "hidden",
                          "text-overflow": "ellipsis",
                          "white-space": "nowrap",
                        }}
                      >
                        <div style={{ display: "flex", "align-items": "center", gap: "0.5rem" }}>
                          <span
                            style={{ flex: "1", overflow: "hidden", "text-overflow": "ellipsis" }}
                          >
                            {match.fullMatch}
                          </span>
                          <CopyButton text={match.fullMatch} />
                        </div>
                      </td>
                      <Show when={namedGroupNames().length > 0}>
                        <For each={namedGroupNames()}>
                          {(name) => {
                            const group = match.groups.find((candidate) => candidate.name === name);
                            return (
                              <td
                                style={{
                                  padding: "0.375rem 1rem",
                                  color: group ? "var(--accent-success)" : "var(--text-muted)",
                                  "border-bottom": "1px solid var(--border)",
                                }}
                              >
                                {group ? group.value : "—"}
                              </td>
                            );
                          }}
                        </For>
                      </Show>
                      <Show when={match.groups.some((group) => group.name === null)}>
                        <td
                          style={{
                            padding: "0.375rem 1rem",
                            color: "var(--text-primary)",
                            "border-bottom": "1px solid var(--border)",
                          }}
                        >
                          {match.groups
                            .filter((group) => group.name === null)
                            .map((group) => group.value)
                            .join(", ")}
                        </td>
                      </Show>
                    </tr>
                  )}
                </For>
              </tbody>
            </table>
          </div>
        </div>
      </Show>

      <Show when={!pattern() && !input().trim()}>
        <p style={{ "font-size": "0.8125rem", color: "var(--text-muted)", margin: "0" }}>
          Enter a regex pattern and test string — matches are highlighted in real time
        </p>
      </Show>
    </div>
  );
}
