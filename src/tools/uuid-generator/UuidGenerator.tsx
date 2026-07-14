import { createSignal, For, Show } from "solid-js";

import CopyButton from "@/components/CopyButton";
import Label from "@/components/primitives/solid/Label";
import ToolActionButton from "@/components/ToolActionButton";
import ToolStatusMessage from "@/components/ToolStatusMessage";
import { copyToClipboard } from "@/lib/clipboard";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function generateUuid(): string {
  return crypto.randomUUID();
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function UuidGenerator() {
  const [uuids, setUuids] = createSignal<string[]>([generateUuid()]);
  const [count, setCount] = createSignal(1);
  const [uppercase, setUppercase] = createSignal(false);
  const [copyStatus, setCopyStatus] = createSignal<"idle" | "success" | "error">("idle");

  function display(uuid: string): string {
    return uppercase() ? uuid.toUpperCase() : uuid;
  }

  function generate() {
    const n = Math.max(1, Math.min(count(), 100));
    setUuids(Array.from({ length: n }, generateUuid));
  }

  async function copyAll() {
    const text = uuids().map(display).join("\n");
    const ok = await copyToClipboard(text);
    setCopyStatus(ok ? "success" : "error");
  }

  function reset() {
    setCount(1);
    setUppercase(false);
    setCopyStatus("idle");
    setUuids([generateUuid()]);
  }

  return (
    <div class="flex flex-col gap-5 p-6 mx-auto w-full max-w-[860px]">
      {/* ------------------------------------------------------------------ */}
      {/* Controls                                                            */}
      {/* ------------------------------------------------------------------ */}
      <div class="flex items-center flex-wrap gap-3">
        {/* Count input */}
        <div class="flex items-center gap-2">
          <Label>Count</Label>
          <input
            type="number"
            min={1}
            max={100}
            value={count()}
            onInput={(e) => setCount(parseInt(e.currentTarget.value, 10) || 1)}
            class="w-20 rounded-md border border-[var(--border)] bg-[var(--bg-secondary)] px-2 py-1 text-sm text-[var(--text-primary)] outline-none"
          />
        </div>

        <ToolActionButton onClick={generate} variant="primary">
          Generate
        </ToolActionButton>

        {/* Uppercase toggle */}
        <ToolActionButton active={uppercase()} onClick={() => setUppercase((v) => !v)}>
          UPPER
        </ToolActionButton>

        {/* Copy all */}
        <Show when={uuids().length > 1}>
          <ToolActionButton onClick={() => void copyAll()}>Copy all</ToolActionButton>
        </Show>

        <ToolActionButton onClick={reset} variant="ghost">
          Reset
        </ToolActionButton>
      </div>

      <Show when={copyStatus() === "success"}>
        <ToolStatusMessage tone="success">Copied all generated UUIDs.</ToolStatusMessage>
      </Show>

      <Show when={copyStatus() === "error"}>
        <ToolStatusMessage tone="error">Could not copy the generated UUIDs.</ToolStatusMessage>
      </Show>

      {/* ------------------------------------------------------------------ */}
      {/* UUID list                                                           */}
      {/* ------------------------------------------------------------------ */}
      <div class="flex flex-col gap-1.5">
        <For each={uuids()}>
          {(uuid) => (
            <div class="flex items-center justify-between px-4 py-2.5 bg-[var(--bg-secondary)] border border-[var(--border)] rounded-md gap-4">
              <code class="text-sm text-[var(--text-primary)] font-mono tracking-wide flex-1 break-all">
                {display(uuid)}
              </code>
              <CopyButton text={display(uuid)} />
            </div>
          )}
        </For>
      </div>

      <ToolStatusMessage tone="muted">
        UUID v4 generated via <code>crypto.randomUUID()</code> · max 100 at once
      </ToolStatusMessage>
    </div>
  );
}
