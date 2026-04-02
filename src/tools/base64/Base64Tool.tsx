import { createSignal, Show } from "solid-js";

import CopyButton from "@/components/CopyButton";
import {
  DEFAULT_IMPORT_MAX_BYTES,
  type FileImportError,
  formatBytes,
  readImportedFile,
} from "@/lib/fileImport";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

type Mode = "encode" | "decode";

/** Encode a string to base64 (UTF-8 safe). */
function encodeBase64(input: string): string {
  return btoa(
    encodeURIComponent(input).replace(/%([0-9A-F]{2})/g, (_, p1: string) =>
      String.fromCharCode(parseInt(p1, 16))
    )
  );
}

/** Decode a base64 string back to UTF-8. */
function decodeBase64(input: string): string {
  const binary = atob(input.trim());
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new TextDecoder().decode(bytes);
}

interface Result {
  value: string;
  error: string | null;
}

function encodeBytesToBase64(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary);
}

function process(input: string, mode: Mode): Result {
  const trimmed = input.trim();
  if (!trimmed) return { value: "", error: null };
  try {
    if (mode === "encode") {
      return { value: encodeBase64(trimmed), error: null };
    } else {
      return { value: decodeBase64(trimmed), error: null };
    }
  } catch {
    return {
      value: "",
      error:
        mode === "decode"
          ? "Invalid base64 — input contains characters outside the base64 alphabet."
          : "Encoding failed — input may contain unsupported characters.",
    };
  }
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function Base64Tool() {
  const [mode, setMode] = createSignal<Mode>("encode");
  const [input, setInput] = createSignal("");
  const [fileError, setFileError] = createSignal<FileImportError | null>(null);
  const [fileNotice, setFileNotice] = createSignal<string | null>(null);

  const result = (): Result => process(input(), mode());

  function swap() {
    const current = result().value;
    setFileError(null);
    setFileNotice(null);
    setMode((m) => (m === "encode" ? "decode" : "encode"));
    setInput(current);
  }

  async function handleFile(file: File) {
    setFileError(null);
    setFileNotice(null);

    if (mode() === "encode") {
      const result = await readImportedFile(file, {
        as: "bytes",
        policy: { maxBytes: DEFAULT_IMPORT_MAX_BYTES },
      });

      if (!result.ok) {
        setFileError(result.error);
        return;
      }

      if (result.decision.status === "warn") {
        setFileNotice(
          `${file.name} is ${formatBytes(result.file.size)}. Large files may take longer to encode.`
        );
      }

      setInput(encodeBytesToBase64(result.value));
      return;
    }

    const result = await readImportedFile(file, {
      as: "text",
      policy: { maxBytes: DEFAULT_IMPORT_MAX_BYTES },
    });

    if (!result.ok) {
      setFileError(result.error);
      return;
    }

    if (result.decision.status === "warn") {
      setFileNotice(
        `${file.name} is ${formatBytes(result.file.size)}. Large files may take longer to decode.`
      );
    }

    setInput(result.value);
  }

  function onDrop(e: DragEvent) {
    e.preventDefault();
    const file = e.dataTransfer?.files?.[0];
    if (file) handleFile(file);
  }

  const fileReadErrorMessage = () => {
    const error = fileError();
    if (!error || error.code !== "read-failed") {
      return null;
    }

    return `${error.file.name} could not be read. ${error.message}.`;
  };

  const tabStyle = (active: boolean) => ({
    padding: "0.375rem 1rem",
    "border-radius": "0.375rem",
    "font-size": "0.8125rem",
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
        "max-width": "860px",
        margin: "0 auto",
        width: "100%",
      }}
    >
      {/* ------------------------------------------------------------------ */}
      {/* Mode toggle + swap                                                  */}
      {/* ------------------------------------------------------------------ */}
      <div
        style={{
          display: "flex",
          "align-items": "center",
          gap: "0.5rem",
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
            "border-radius": "0.5rem",
          }}
        >
          <button style={tabStyle(mode() === "encode")} onClick={() => setMode("encode")}>
            Encode
          </button>
          <button style={tabStyle(mode() === "decode")} onClick={() => setMode("decode")}>
            Decode
          </button>
        </div>

        <button
          onClick={swap}
          title="Swap input/output"
          style={{
            "margin-left": "auto",
            padding: "0.375rem 0.75rem",
            "border-radius": "0.375rem",
            border: "1px solid var(--border)",
            background: "var(--bg-secondary)",
            color: "var(--text-secondary)",
            "font-size": "0.8125rem",
            cursor: "pointer",
          }}
        >
          ⇅ Swap
        </button>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Input                                                               */}
      {/* ------------------------------------------------------------------ */}
      <div style={{ display: "flex", "flex-direction": "column", gap: "0.5rem" }}>
        <label
          style={{
            "font-size": "0.75rem",
            "font-weight": "600",
            "letter-spacing": "0.05em",
            "text-transform": "uppercase",
            color: "var(--text-secondary)",
          }}
        >
          {mode() === "encode" ? "Plain text" : "Base64"}
        </label>

        {/* Drop zone wrapper */}
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={onDrop}
          style={{ position: "relative" }}
        >
          <textarea
            value={input()}
            onInput={(e) => {
              setFileError(null);
              setFileNotice(null);
              setInput(e.currentTarget.value);
            }}
            placeholder={
              mode() === "encode"
                ? "Type or paste text to encode, or drop a file…"
                : "Paste base64 to decode, or drop a file…"
            }
            rows={8}
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

        {/* File open button */}
        <div style={{ display: "flex", "align-items": "center", gap: "0.5rem" }}>
          <label
            style={{
              "font-size": "0.8125rem",
              color: "var(--accent-primary)",
              cursor: "pointer",
            }}
          >
            Open file
            <input
              type="file"
              style={{ display: "none" }}
              onChange={(e) => {
                const file = e.currentTarget.files?.[0];
                if (file) handleFile(file);
                e.currentTarget.value = "";
              }}
            />
          </label>
          <span style={{ "font-size": "0.8125rem", color: "var(--text-muted)" }}>
            · max {formatBytes(DEFAULT_IMPORT_MAX_BYTES)}
          </span>
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Error banner                                                        */}
      {/* ------------------------------------------------------------------ */}
      <Show when={fileNotice()}>
        <div
          style={{
            padding: "0.75rem 1rem",
            "border-radius": "0.5rem",
            border: "1px solid color-mix(in srgb, var(--accent-warning) 60%, transparent)",
            background: "color-mix(in srgb, var(--accent-warning) 12%, transparent)",
            color: "var(--accent-warning)",
            "font-size": "0.875rem",
          }}
        >
          {fileNotice()}
        </div>
      </Show>
      <Show when={fileError()?.code === "file-too-large"}>
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
          File is too large — maximum supported size is {formatBytes(DEFAULT_IMPORT_MAX_BYTES)}.
        </div>
      </Show>
      <Show when={fileError()?.code === "read-failed"}>
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
          {fileReadErrorMessage()}
        </div>
      </Show>
      <Show when={result().error}>
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
          {result().error}
        </div>
      </Show>

      {/* ------------------------------------------------------------------ */}
      {/* Output                                                              */}
      {/* ------------------------------------------------------------------ */}
      <Show when={result().value}>
        {(value) => (
          <div
            style={{
              background: "var(--bg-secondary)",
              border: "1px solid var(--border)",
              "border-radius": "0.5rem",
              overflow: "hidden",
            }}
          >
            {/* Output header */}
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
                {mode() === "encode" ? "Base64" : "Plain text"}
              </span>
              <CopyButton text={value()} />
            </div>

            {/* Output body */}
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
              <code>{value()}</code>
            </pre>
          </div>
        )}
      </Show>
    </div>
  );
}
