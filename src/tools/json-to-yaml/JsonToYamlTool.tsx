import { createMemo, createSignal, Show } from "solid-js";

import CopyButton from "@/components/CopyButton";
import Card from "@/components/primitives/solid/Card";
import Label from "@/components/primitives/solid/Label";
import Textarea from "@/components/primitives/solid/Textarea";
import ToolStatusMessage from "@/components/ToolStatusMessage";
import { convertJsonToYaml } from "@/lib/jsonToYaml";

export default function JsonToYamlTool() {
  const [input, setInput] = createSignal('{\n  "hello": "world"\n}');
  const result = createMemo(() => convertJsonToYaml(input()));
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
      <Textarea
        label="JSON input"
        value={input()}
        onInput={(value) => setInput(value)}
        placeholder="Paste JSON to convert…"
        rows={14}
        spellcheck={false}
        error={!!error()}
      />

      <Card class="flex flex-col gap-3">
        <div class="flex items-center justify-between">
          <Label>YAML output</Label>
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
