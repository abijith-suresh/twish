import { createMemo, createSignal, Show } from "solid-js";

import CopyButton from "@/components/CopyButton";
import Label from "@/components/primitives/solid/Label";
import Textarea from "@/components/primitives/solid/Textarea";
import ToolActionButton from "@/components/ToolActionButton";
import { formatJson, type IndentSize, type JsonFormatResult } from "@/lib/jsonFormatter";

export default function JsonFormatter() {
  const [input, setInput] = createSignal("");
  const [indent, setIndent] = createSignal<IndentSize>(2);
  const [minify, setMinify] = createSignal(false);
  const [sortKeys, setSortKeys] = createSignal(false);
  const result = createMemo(
    (): JsonFormatResult => formatJson(input(), indent(), minify(), sortKeys())
  );

  return (
    <div class="flex flex-col gap-5 p-6 mx-auto w-full max-w-[900px]">
      <div class="flex items-center flex-wrap gap-3">
        <div class="flex items-center gap-1 p-1 rounded-md border border-[var(--border)] bg-[var(--bg-secondary)]">
          <ToolActionButton
            active={indent() === 2 && !minify()}
            variant={indent() === 2 && !minify() ? "primary" : "ghost"}
            onClick={() => {
              setIndent(2);
              setMinify(false);
            }}
          >
            2 spaces
          </ToolActionButton>
          <ToolActionButton
            active={indent() === 4 && !minify()}
            variant={indent() === 4 && !minify() ? "primary" : "ghost"}
            onClick={() => {
              setIndent(4);
              setMinify(false);
            }}
          >
            4 spaces
          </ToolActionButton>
        </div>

        <ToolActionButton
          active={minify()}
          variant="secondary"
          onClick={() => setMinify((value) => !value)}
        >
          Minify
        </ToolActionButton>

        <ToolActionButton
          active={sortKeys()}
          variant="secondary"
          onClick={() => setSortKeys((value) => !value)}
        >
          Sort keys
        </ToolActionButton>

        <Show when={input().trim()}>
          <ToolActionButton variant="ghost" onClick={() => setInput("")}>
            Clear
          </ToolActionButton>
        </Show>
      </div>

      <Textarea
        label="Input JSON"
        value={input()}
        onInput={(value) => setInput(value)}
        placeholder="Paste JSON here…"
        rows={10}
        autofocus
        spellcheck={false}
        error={!!result().error}
      />

      <Show when={result().error}>
        {(msg) => (
          <div
            role="alert"
            class="flex flex-col gap-3 p-3 rounded-lg border border-[var(--accent-error)] bg-[color-mix(in_srgb,var(--accent-error)_12%,transparent)] text-[var(--accent-error)] text-sm"
          >
            <div class="font-mono">{msg()}</div>
            <Show when={result().errorLine && result().errorColumn}>
              <div class="text-[var(--text-secondary)] text-[0.8125rem] font-mono">
                Line {result().errorLine}, column {result().errorColumn}
              </div>
            </Show>
            <Show when={result().errorContext}>
              {(context) => (
                <pre class="m-0 p-3 bg-[color-mix(in_srgb,var(--bg-secondary)_88%,transparent)] text-[var(--text-primary)] border border-[var(--border)] rounded-md text-[0.8125rem] leading-normal font-mono whitespace-pre-wrap break-words">
                  {context()}
                </pre>
              )}
            </Show>
          </div>
        )}
      </Show>

      <Show when={result().html}>
        {(html) => (
          <div class="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg overflow-hidden">
            <div class="flex items-center justify-between px-4 py-2.5 border-b border-[var(--border)]">
              <Label>
                {minify()
                  ? `Minified${sortKeys() ? " · sorted" : ""}`
                  : `Formatted · ${indent()} spaces${sortKeys() ? " · sorted" : ""}`}
              </Label>
              <CopyButton text={result().raw} />
            </div>

            <pre
              class="m-0 p-4 overflow-x-auto text-[0.8125rem] leading-[1.6] text-[var(--text-primary)] font-mono whitespace-pre-wrap break-all"
              innerHTML={html()}
            />
          </div>
        )}
      </Show>
    </div>
  );
}
