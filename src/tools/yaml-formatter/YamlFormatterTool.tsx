import { createMemo, createSignal, Show } from "solid-js";

import CopyButton from "@/components/CopyButton";
import Card from "@/components/primitives/solid/Card";
import Label from "@/components/primitives/solid/Label";
import Textarea from "@/components/primitives/solid/Textarea";
import ToolActionButton from "@/components/ToolActionButton";
import ToolStatusMessage from "@/components/ToolStatusMessage";
import { formatYaml } from "@/lib/yamlFormatter";

export default function YamlFormatterTool() {
  const [input, setInput] = createSignal("root:\n  child: [3, 2, 1]");
  const [indent, setIndent] = createSignal(2);
  const [sortKeys, setSortKeys] = createSignal(false);

  const result = createMemo(() => formatYaml(input(), { indent: indent(), sortKeys: sortKeys() }));
  const output = createMemo(() => {
    const current = result();
    return current.ok ? current.output : "";
  });
  const error = createMemo(() => {
    const current = result();
    return current.ok ? "" : current.error;
  });

  return (
    <div class="grid grid-cols-[repeat(auto-fit,minmax(320px,1fr))] gap-5 p-6 mx-auto w-full max-w-[1100px]">
      <div class="flex flex-col gap-3">
        <div class="flex items-center gap-3 flex-wrap">
          <Label>Indent</Label>
          <input
            type="number"
            min={2}
            max={8}
            value={indent()}
            onInput={(event) => setIndent(Number(event.currentTarget.value) || 2)}
            class="w-20 rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] px-3 py-2 text-sm text-[var(--text-primary)] outline-none"
          />
          <ToolActionButton active={sortKeys()} onClick={() => setSortKeys((current) => !current)}>
            Sort keys
          </ToolActionButton>
        </div>

        <Textarea
          label="YAML input"
          value={input()}
          onInput={(value) => setInput(value)}
          placeholder="Paste YAML to format…"
          rows={14}
          spellcheck={false}
          error={!!error()}
        />
      </div>

      <Card class="flex flex-col gap-3">
        <div class="flex items-center justify-between">
          <Label>Formatted YAML</Label>
          <CopyButton text={output()} label="Copy YAML" />
        </div>

        <Show
          when={!error()}
          fallback={<ToolStatusMessage tone="error">{error()}</ToolStatusMessage>}
        >
          <pre class="m-0 p-4 rounded-lg border border-[var(--border)] bg-[var(--bg-primary)] text-[var(--text-primary)] font-mono text-sm leading-relaxed whitespace-pre-wrap break-words min-h-[20rem]">
            {output() || "—"}
          </pre>
        </Show>
      </Card>
    </div>
  );
}
