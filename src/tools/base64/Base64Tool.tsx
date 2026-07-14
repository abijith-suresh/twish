import { createMemo, createSignal, Show } from "solid-js";

import CopyButton from "@/components/CopyButton";
import Card from "@/components/primitives/solid/Card";
import Label from "@/components/primitives/solid/Label";
import Textarea from "@/components/primitives/solid/Textarea";
import ToolActionButton from "@/components/ToolActionButton";
import ToolStatusMessage from "@/components/ToolStatusMessage";
import {
  type Base64Mode,
  type Base64Variant,
  type Base64Workflow,
  encodeBytesToBase64,
  formatBase64FileNotice,
  formatBase64FileTooLargeMessage,
  processBase64Input,
} from "@/lib/base64";
import {
  DEFAULT_IMPORT_MAX_BYTES,
  type FileImportError,
  formatBytes,
  type ImportedFileMeta,
  readImportedFile,
} from "@/lib/fileImport";

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function Base64Tool() {
  const [mode, setMode] = createSignal<Base64Mode>("encode");
  const [variant, setVariant] = createSignal<Base64Variant>("standard");
  const [workflow, setWorkflow] = createSignal<Base64Workflow>("text");
  const [input, setInput] = createSignal("");
  const [fileError, setFileError] = createSignal<FileImportError | null>(null);
  const [loadedFile, setLoadedFile] = createSignal<ImportedFileMeta | null>(null);
  const [loadedFileBytes, setLoadedFileBytes] = createSignal<Uint8Array | null>(null);
  const [fileNotice, setFileNotice] = createSignal<string | null>(null);

  const textInput = createMemo(() => (mode() === "encode" && workflow() === "file" ? "" : input()));
  const result = createMemo(() => {
    if (mode() === "encode" && workflow() === "file" && loadedFileBytes()) {
      return {
        ok: true as const,
        value: encodeBytesToBase64(loadedFileBytes() ?? new Uint8Array(), variant()),
        outputKind: "text" as const,
      };
    }

    return processBase64Input(textInput(), mode(), variant(), workflow(), {
      sourceName: loadedFile()?.name,
    });
  });
  const outputValue = createMemo(() => {
    const current = result();
    return current.ok ? current.value : "";
  });
  const transformError = createMemo(() => {
    const current = result();
    return current.ok ? null : current.error;
  });
  const binaryOutput = createMemo(() => {
    const current = result();
    return current.ok && current.outputKind === "bytes" ? current : null;
  });
  const fileSummary = createMemo(() => {
    const file = loadedFile();
    if (!file) {
      return "";
    }

    return `${file.name}\n${formatBytes(file.size)}${file.type ? `\n${file.type}` : ""}`;
  });

  function swap() {
    const current = outputValue();
    setFileError(null);
    setFileNotice(null);
    setLoadedFile(null);
    setLoadedFileBytes(null);
    setMode((m) => (m === "encode" ? "decode" : "encode"));
    setInput(current);
  }

  function reset() {
    setMode("encode");
    setVariant("standard");
    setWorkflow("text");
    setInput("");
    setFileError(null);
    setLoadedFile(null);
    setLoadedFileBytes(null);
    setFileNotice(null);
  }

  function handleModeChange(nextMode: Base64Mode) {
    setMode(nextMode);
    setLoadedFile(null);
    setLoadedFileBytes(null);
    setFileError(null);
    setFileNotice(null);
  }

  function handleWorkflowChange(nextWorkflow: Base64Workflow) {
    setWorkflow(nextWorkflow);
    setLoadedFile(null);
    setLoadedFileBytes(null);
    setFileError(null);
    setFileNotice(null);
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
        setFileNotice(formatBase64FileNotice(result.file, mode(), workflow()));
      }

      setLoadedFile(result.file);
      setLoadedFileBytes(result.value);
      setWorkflow("file");
      setInput("");
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
      setFileNotice(formatBase64FileNotice(result.file, mode(), workflow()));
    }

    setLoadedFile(result.file);
    setLoadedFileBytes(null);
    setInput(result.value);
  }

  function onDrop(e: DragEvent) {
    e.preventDefault();
    const file = e.dataTransfer?.files?.[0];
    if (file) handleFile(file);
  }

  function downloadDecodedBytes() {
    const current = result();
    if (!current.ok || current.outputKind !== "bytes" || current.bytes.length === 0) {
      return;
    }

    const blob = new Blob([current.bytes as unknown as BlobPart], {
      type: "application/octet-stream",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = current.downloadName;
    link.click();
    URL.revokeObjectURL(url);
  }

  const fileReadErrorMessage = () => {
    const error = fileError();
    if (error?.code !== "read-failed") {
      return null;
    }

    return `${error.file.name} could not be read. ${error.message}.`;
  };

  return (
    <div class="flex flex-col gap-5 p-6 mx-auto w-full max-w-[860px]">
      {/* ------------------------------------------------------------------ */}
      {/* Mode toggle + swap                                                  */}
      {/* ------------------------------------------------------------------ */}
      <div class="flex flex-wrap gap-2 items-center">
        <div class="flex items-center gap-1 p-1 bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg">
          <ToolActionButton
            active={mode() === "encode"}
            variant={mode() === "encode" ? "primary" : "ghost"}
            onClick={() => handleModeChange("encode")}
          >
            Encode
          </ToolActionButton>
          <ToolActionButton
            active={mode() === "decode"}
            variant={mode() === "decode" ? "primary" : "ghost"}
            onClick={() => handleModeChange("decode")}
          >
            Decode
          </ToolActionButton>
        </div>

        <div class="flex gap-1 items-center">
          <ToolActionButton
            active={variant() === "standard"}
            variant={variant() === "standard" ? "primary" : "ghost"}
            onClick={() => setVariant("standard")}
          >
            Base64
          </ToolActionButton>
          <ToolActionButton
            active={variant() === "url"}
            variant={variant() === "url" ? "primary" : "ghost"}
            onClick={() => setVariant("url")}
          >
            Base64url
          </ToolActionButton>
        </div>

        <div class="flex gap-1 items-center">
          <ToolActionButton
            active={workflow() === "text"}
            variant={workflow() === "text" ? "primary" : "ghost"}
            onClick={() => handleWorkflowChange("text")}
          >
            Text
          </ToolActionButton>
          <ToolActionButton
            active={workflow() === "file"}
            variant={workflow() === "file" ? "primary" : "ghost"}
            onClick={() => handleWorkflowChange("file")}
          >
            File / binary
          </ToolActionButton>
        </div>

        <div class="flex gap-2 items-center ml-auto">
          <ToolActionButton onClick={swap} title="Swap input/output">
            ⇅ Swap
          </ToolActionButton>
          <ToolActionButton onClick={reset} variant="ghost">
            Reset
          </ToolActionButton>
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Input                                                               */}
      {/* ------------------------------------------------------------------ */}
      <div class="flex flex-col gap-2">
        <Label>
          {mode() === "encode"
            ? workflow() === "text"
              ? "Plain text"
              : "Binary file"
            : variant() === "url"
              ? "Base64url"
              : "Base64"}
        </Label>

        {/* Drop zone wrapper */}
        <div role="none" onDragOver={(e) => e.preventDefault()} onDrop={onDrop}>
          <Textarea
            value={mode() === "encode" && workflow() === "file" ? fileSummary() : input()}
            onInput={(e) => {
              setFileError(null);
              setFileNotice(null);
              setLoadedFile(null);
              setLoadedFileBytes(null);
              setInput(e);
            }}
            placeholder={
              mode() === "encode"
                ? workflow() === "text"
                  ? "Type or paste text to encode, or drop a file…"
                  : "Drop or open a file to encode it as Base64…"
                : workflow() === "file"
                  ? "Paste Base64 to inspect as bytes, or drop an encoded file…"
                  : "Paste Base64 to decode as UTF-8 text, or drop a file…"
            }
            rows={8}
            spellcheck={false}
            readonly={mode() === "encode" && workflow() === "file"}
          />
        </div>

        {/* File open button */}
        <div class="flex items-center gap-2">
          <label class="text-sm text-[var(--accent-primary)] cursor-pointer">
            Open file
            <input
              type="file"
              class="hidden"
              onChange={(e) => {
                const file = e.currentTarget.files?.[0];
                if (file) handleFile(file);
                e.currentTarget.value = "";
              }}
            />
          </label>
          <span class="text-sm text-[var(--text-muted)]">
            Local-only input handling with explicit text and file workflows
          </span>
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Error banner                                                        */}
      {/* ------------------------------------------------------------------ */}
      <Show when={fileNotice()}>
        <ToolStatusMessage tone="warning">{fileNotice()}</ToolStatusMessage>
      </Show>
      <Show when={fileError()?.code === "file-too-large"}>
        <ToolStatusMessage tone="error">
          {formatBase64FileTooLargeMessage(DEFAULT_IMPORT_MAX_BYTES)}
        </ToolStatusMessage>
      </Show>
      <Show when={fileError()?.code === "read-failed"}>
        <ToolStatusMessage tone="error">{fileReadErrorMessage()}</ToolStatusMessage>
      </Show>
      <Show when={transformError()}>
        <ToolStatusMessage tone="error">{transformError()}</ToolStatusMessage>
      </Show>

      {/* ------------------------------------------------------------------ */}
      {/* Output                                                              */}
      {/* ------------------------------------------------------------------ */}
      <Show when={outputValue()}>
        {(value) => (
          <Card class="overflow-hidden p-0">
            {/* Output header */}
            <div class="flex items-center justify-between px-4 py-2.5 border-b border-[var(--border)]">
              <Label>
                {mode() === "encode"
                  ? variant() === "url"
                    ? "Base64url"
                    : "Base64"
                  : workflow() === "file"
                    ? "Decoded bytes · binary output"
                    : "Decoded text"}
              </Label>
              <Show when={binaryOutput()} fallback={<CopyButton text={value()} />}>
                <ToolActionButton onClick={downloadDecodedBytes}>Download file</ToolActionButton>
              </Show>
            </div>

            {/* Output body */}
            <pre class="m-0 p-4 overflow-x-auto text-xs leading-relaxed text-[var(--text-primary)] font-mono whitespace-pre-wrap break-all">
              <code>{value()}</code>
            </pre>
          </Card>
        )}
      </Show>

      <Show
        when={!input().trim() && !fileSummary() && !fileNotice() && !fileError() && !outputValue()}
      >
        <ToolStatusMessage tone="muted">
          Standard Base64 and Base64url are both supported. File workflows stay local and surface
          large-input warnings instead of failing silently.
        </ToolStatusMessage>
      </Show>
    </div>
  );
}
