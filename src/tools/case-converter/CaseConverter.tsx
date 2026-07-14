import { createMemo, createSignal, For, Show } from "solid-js";
import CopyButton from "@/components/CopyButton";
import Card from "@/components/primitives/solid/Card";
import Label from "@/components/primitives/solid/Label";
import Textarea from "@/components/primitives/solid/Textarea";
import ToolStatusMessage from "@/components/ToolStatusMessage";
import { convertCaseVariants } from "@/lib/caseConverter";

const VARIANT_LABELS = [
  ["lowercase", "lowercase"],
  ["uppercase", "UPPERCASE"],
  ["camelCase", "camelCase"],
  ["pascalCase", "PascalCase"],
  ["snakeCase", "snake_case"],
  ["kebabCase", "kebab-case"],
  ["constantCase", "CONSTANT_CASE"],
  ["dotCase", "dot.case"],
  ["pathCase", "path/case"],
  ["sentenceCase", "Sentence case"],
  ["headerCase", "Header-Case"],
] as const satisfies ReadonlyArray<readonly [keyof ReturnType<typeof convertCaseVariants>, string]>;

export default function CaseConverter() {
  const [input, setInput] = createSignal("");
  const variants = createMemo(() => convertCaseVariants(input()));
  const hasInput = createMemo(() => input().trim().length > 0);

  return (
    <div class="flex flex-col gap-5 p-6 mx-auto w-full max-w-[900px]">
      <Textarea
        label="Source text"
        value={input()}
        onInput={setInput}
        placeholder="Paste text, identifiers, or titles to fan out into multiple case styles…"
        rows={6}
      />

      <Show
        when={hasInput()}
        fallback={
          <ToolStatusMessage tone="muted">
            Enter text once to generate copyable case variants locally.
          </ToolStatusMessage>
        }
      >
        <div class="grid grid-cols-[repeat(auto-fit,minmax(240px,1fr))] gap-3">
          <For each={VARIANT_LABELS}>
            {([key, label]) => (
              <Card class="flex flex-col gap-2">
                <div class="flex items-center justify-between gap-3">
                  <Label>{label}</Label>
                  <CopyButton text={variants()[key]} label={`Copy ${label}`} />
                </div>
                <code class="m-0 text-[var(--text-primary)] text-sm leading-[1.7] font-mono whitespace-pre-wrap break-words">
                  {variants()[key] || "—"}
                </code>
              </Card>
            )}
          </For>
        </div>
      </Show>
    </div>
  );
}
