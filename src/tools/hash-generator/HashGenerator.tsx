import { createMemo, createSignal, For, onCleanup, Show } from "solid-js";

import CopyButton from "@/components/CopyButton";
import Card from "@/components/primitives/solid/Card";
import Label from "@/components/primitives/solid/Label";
import Textarea from "@/components/primitives/solid/Textarea";
import ToolActionButton from "@/components/ToolActionButton";
import ToolStatusMessage from "@/components/ToolStatusMessage";
import {
  DEFAULT_IMPORT_MAX_BYTES,
  type FileImportError,
  formatBytes,
  type ImportedFileMeta,
  readImportedFile,
} from "@/lib/fileImport";
import { type HashResult, hashBytesWithAlgorithms, hashTextWithAlgorithms } from "@/lib/hash";

type HashWorkflow = "text" | "file";

export default function HashGenerator() {
  const [workflow, setWorkflow] = createSignal<HashWorkflow>("text");
  const [input, setInput] = createSignal("");
  const [results, setResults] = createSignal<HashResult[]>([]);
  const [computing, setComputing] = createSignal(false);
  const [fileError, setFileError] = createSignal<FileImportError | null>(null);
  const [loadedFile, setLoadedFile] = createSignal<ImportedFileMeta | null>(null);
  const [loadedFileBytes, setLoadedFileBytes] = createSignal<Uint8Array | null>(null);
  const [fileNotice, setFileNotice] = createSignal<string | null>(null);

  let debounceTimer: ReturnType<typeof setTimeout> | undefined;

  const fileSummary = createMemo(() => {
    const file = loadedFile();
    if (!file) {
      return "";
    }

    return `${file.name}\n${formatBytes(file.size)}${file.type ? `\n${file.type}` : ""}`;
  });
  const readFileError = createMemo(() => {
    const error = fileError();
    return error?.code === "read-failed" ? error : null;
  });

  async function computeText(text: string) {
    if (!text.trim()) {
      setResults([]);
      setComputing(false);
      return;
    }

    setComputing(true);

    try {
      setResults(await hashTextWithAlgorithms(text));
    } finally {
      setComputing(false);
    }
  }

  async function computeBytes(bytes: Uint8Array) {
    if (bytes.length === 0) {
      setResults([]);
      setComputing(false);
      return;
    }

    setComputing(true);

    try {
      setResults(await hashBytesWithAlgorithms(bytes));
    } finally {
      setComputing(false);
    }
  }

  function handleInput(value: string) {
    setInput(value);
    setFileError(null);
    setFileNotice(null);
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => void computeText(value), 300);
  }

  function handleWorkflowChange(nextWorkflow: HashWorkflow) {
    clearTimeout(debounceTimer);
    setWorkflow(nextWorkflow);
    setInput("");
    setResults([]);
    setComputing(false);
    setFileError(null);
    setLoadedFile(null);
    setLoadedFileBytes(null);
    setFileNotice(null);
  }

  function handleClear() {
    clearTimeout(debounceTimer);
    setInput("");
    setResults([]);
    setComputing(false);
    setFileError(null);
    setLoadedFile(null);
    setLoadedFileBytes(null);
    setFileNotice(null);
    setWorkflow("text");
  }

  async function handleFile(file: File) {
    clearTimeout(debounceTimer);
    setFileError(null);
    setFileNotice(null);

    const result = await readImportedFile(file, {
      as: "bytes",
      policy: { maxBytes: DEFAULT_IMPORT_MAX_BYTES },
    });

    if (!result.ok) {
      setFileError(result.error);
      setResults([]);
      return;
    }

    if (result.decision.status === "warn") {
      setFileNotice(
        `${result.file.name} is ${formatBytes(result.file.size)}. Large files may take longer to hash.`
      );
    }

    setWorkflow("file");
    setLoadedFile(result.file);
    setLoadedFileBytes(result.value);
    setInput("");
    await computeBytes(result.value);
  }

  function onDrop(event: DragEvent) {
    event.preventDefault();
    const file = event.dataTransfer?.files?.[0];
    if (file) {
      void handleFile(file);
    }
  }

  onCleanup(() => {
    clearTimeout(debounceTimer);
  });

  return (
    <div class="flex flex-col gap-5 p-6 mx-auto w-full max-w-[860px]">
      <div class="flex flex-wrap items-center gap-3">
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
            File
          </ToolActionButton>
        </div>

        <ToolActionButton
          onClick={() =>
            workflow() === "file"
              ? loadedFileBytes() && void computeBytes(loadedFileBytes() ?? new Uint8Array())
              : void computeText(input())
          }
          variant="primary"
          disabled={workflow() === "file" ? !loadedFileBytes() : !input().trim()}
        >
          Hash input
        </ToolActionButton>
        <ToolActionButton
          onClick={handleClear}
          disabled={!input().trim() && !loadedFileBytes() && results().length === 0}
        >
          Clear
        </ToolActionButton>
        <span class="text-xs text-[var(--text-muted)]">
          Local-only hashing via the browser&apos;s Web Crypto API
        </span>
      </div>

      <div class="flex flex-col gap-1.5">
        <Label>{workflow() === "text" ? "Input text" : "Input file"}</Label>
        <div role="none" onDragOver={(event) => event.preventDefault()} onDrop={onDrop}>
          <Textarea
            value={workflow() === "file" ? fileSummary() : input()}
            onInput={(event) => handleInput(event)}
            placeholder={
              workflow() === "text"
                ? "Type or paste text to hash…"
                : "Drop a file here or use the file picker to hash it locally…"
            }
            rows={5}
            spellcheck={false}
            readonly={workflow() === "file"}
          />
        </div>

        <div class="flex items-center gap-2">
          <label class="text-sm text-[var(--accent-primary)] cursor-pointer">
            Open file
            <input
              type="file"
              class="hidden"
              onChange={(event) => {
                const file = event.currentTarget.files?.[0];
                if (file) {
                  void handleFile(file);
                }
                event.currentTarget.value = "";
              }}
            />
          </label>
          <span class="text-sm text-[var(--text-muted)]">
            Shared local file import flow with explicit read and size failures
          </span>
        </div>
      </div>

      <Show when={fileNotice()}>
        <ToolStatusMessage tone="warning">{fileNotice()}</ToolStatusMessage>
      </Show>
      <Show when={fileError()?.code === "file-too-large"}>
        <ToolStatusMessage tone="error">
          File is too large. Maximum supported size is {formatBytes(DEFAULT_IMPORT_MAX_BYTES)}.
        </ToolStatusMessage>
      </Show>
      <Show when={readFileError()}>
        {(error) => (
          <ToolStatusMessage tone="error">
            {error().file.name} could not be read. {error().message}.
          </ToolStatusMessage>
        )}
      </Show>

      <Show when={computing()}>
        <ToolStatusMessage tone="muted">Computing…</ToolStatusMessage>
      </Show>

      <Show when={results().length > 0}>
        <div class="flex flex-col gap-3">
          <For each={results()}>
            {(result) => (
              <Card class="overflow-hidden p-0">
                <div class="flex items-center justify-between px-4 py-2 border-b border-[var(--border)]">
                  <span class="text-xs font-bold tracking-wider uppercase text-[var(--accent-primary)]">
                    {result.algorithm}
                  </span>
                  <CopyButton text={result.hex} />
                </div>

                <pre class="m-0 p-3 px-4 text-xs leading-relaxed text-[var(--text-primary)] font-mono whitespace-pre-wrap break-all">
                  {result.hex}
                </pre>
              </Card>
            )}
          </For>
        </div>
      </Show>

      <Show when={!input().trim() && !loadedFileBytes() && results().length === 0}>
        <ToolStatusMessage tone="muted">
          SHA-1 · SHA-256 · SHA-384 · SHA-512 computed locally for text and file workflows
        </ToolStatusMessage>
      </Show>
    </div>
  );
}
