import { createMemo, createSignal, Show } from "solid-js";

import CopyButton from "@/components/CopyButton";
import Card from "@/components/primitives/solid/Card";
import Label from "@/components/primitives/solid/Label";
import Textarea from "@/components/primitives/solid/Textarea";
import ToolStatusMessage from "@/components/ToolStatusMessage";
import { convertYamlToJson } from "@/lib/yamlToJson";

export default function YamlToJsonTool() {
  const [input, setInput] = createSignal("name: demo\nenabled: true");
  const result = createMemo(() => convertYamlToJson(input()));
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
        label="YAML input"
        value={input()}
        onInput={(value) => setInput(value)}
        placeholder="Paste YAML to convert…"
        rows={14}
        spellcheck={false}
        error={!!error()}
      />

      <Card class="flex flex-col gap-3">
        <div class="flex items-center justify-between">
          <Label>JSON output</Label>
          <CopyButton text={output()} label="Copy JSON" />
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
