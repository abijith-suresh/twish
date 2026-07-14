import { createMemo, createSignal, For, Show } from "solid-js";
import Card from "@/components/primitives/solid/Card";
import Label from "@/components/primitives/solid/Label";
import ToolActionButton from "@/components/ToolActionButton";
import ToolStatusMessage from "@/components/ToolStatusMessage";
import { SUPPORTED_CRON_SYNTAX } from "@/lib/cron";
import { buildCronScheduleSummary, type CronTimeZoneMode } from "@/lib/cronSchedule";

function formatPreview(date: Date, mode: CronTimeZoneMode): string {
  return mode === "utc"
    ? `${date.toISOString().replace("T", " ").replace(".000Z", " UTC")}`
    : date.toLocaleString();
}

export default function CronTool() {
  const [input, setInput] = createSignal("30 9 * * 1");
  const [timeZone, setTimeZone] = createSignal<CronTimeZoneMode>("local");

  const summary = createMemo(() =>
    buildCronScheduleSummary(input(), {
      start: new Date(),
      count: 5,
      timeZone: timeZone(),
    })
  );
  const description = createMemo(() => {
    const current = summary();
    return current.ok ? current.description : "";
  });
  const nextRuns = createMemo(() => {
    const current = summary();
    return current.ok ? current.nextRuns : [];
  });
  const error = createMemo(() => {
    const current = summary();
    return current.ok ? "" : current.error.message;
  });

  return (
    <div class="flex flex-col gap-5 p-6 mx-auto w-full max-w-[900px]">
      <div class="flex flex-col gap-1.5">
        <Label>Cron expression</Label>
        <input
          type="text"
          value={input()}
          onInput={(event) => setInput(event.currentTarget.value)}
          spellcheck={false}
          class="w-full rounded-lg border bg-[var(--bg-secondary)] px-4 py-2.5 text-[var(--text-primary)] outline-none font-mono text-[0.9375rem] focus:border-[var(--accent-primary)]"
          classList={{
            "border-[var(--border)]": !error(),
            "border-[var(--accent-error)]": !!error(),
          }}
        />
      </div>

      <div class="flex gap-2 flex-wrap items-center">
        <Label>Timezone</Label>
        <ToolActionButton
          active={timeZone() === "local"}
          variant={timeZone() === "local" ? "primary" : "secondary"}
          onClick={() => setTimeZone("local")}
        >
          Local time
        </ToolActionButton>
        <ToolActionButton
          active={timeZone() === "utc"}
          variant={timeZone() === "utc" ? "primary" : "secondary"}
          onClick={() => setTimeZone("utc")}
        >
          UTC
        </ToolActionButton>
      </div>

      <Show
        when={!error()}
        fallback={<ToolStatusMessage tone="error">{error()}</ToolStatusMessage>}
      >
        <Card class="flex flex-col gap-3">
          <Label>Humanized schedule</Label>
          <strong class="text-[var(--text-primary)] text-[1.1rem]">{description()}</strong>
        </Card>

        <Card class="flex flex-col gap-3">
          <Label>Next runs</Label>
          <div class="flex flex-col gap-2">
            <For each={nextRuns()}>
              {(run, index) => (
                <code class="px-3 py-2.5 bg-[var(--bg-primary)] border border-[var(--border)] rounded-lg text-[var(--text-primary)] block">
                  {index() + 1}. {formatPreview(run, timeZone())}
                </code>
              )}
            </For>
          </div>
        </Card>
      </Show>

      <ToolStatusMessage tone="muted">
        Supported subset: {SUPPORTED_CRON_SYNTAX.fieldOrder.join(" ")} · operators{" "}
        {SUPPORTED_CRON_SYNTAX.operators.join(" ")} · preview computation stays local-only.
      </ToolStatusMessage>
    </div>
  );
}
