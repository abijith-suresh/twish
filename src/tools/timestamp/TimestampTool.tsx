import { createMemo, createSignal, For, Show } from "solid-js";

import CopyButton from "@/components/CopyButton";
import Card from "@/components/primitives/solid/Card";
import Input from "@/components/primitives/solid/Input";
import Label from "@/components/primitives/solid/Label";
import Select from "@/components/primitives/solid/Select";
import ToolActionButton from "@/components/ToolActionButton";
import ToolStatusMessage from "@/components/ToolStatusMessage";
import {
  DEFAULT_ZONES,
  formatInZone,
  getDerivedTimestampFormats,
  localInputToMs,
  msToLocalInput,
  PRESET_ZONES,
  parseEpoch,
  type TimeZoneOption,
} from "@/lib/timestamp";

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function TimestampTool() {
  const [epochInput, setEpochInput] = createSignal("");
  const [datetimeInput, setDatetimeInput] = createSignal("");
  const [zones, setZones] = createSignal<TimeZoneOption[]>(DEFAULT_ZONES);

  const parsed = createMemo((): { ms: number; unit: "s" | "ms" } | null => {
    // Prefer epoch input; fall back to datetime-local
    const raw = epochInput().trim();
    if (raw) return parseEpoch(raw);
    const dtMs = localInputToMs(datetimeInput());
    if (dtMs !== null) return { ms: dtMs, unit: "ms" };
    return null;
  });

  const date = createMemo((): Date | null => {
    const p = parsed();
    if (!p) return null;
    const d = new Date(p.ms);
    return Number.isNaN(d.getTime()) ? null : d;
  });

  function useNow() {
    const now = Date.now();
    setEpochInput(String(Math.floor(now / 1000)));
    setDatetimeInput(msToLocalInput(now));
  }

  function reset() {
    setEpochInput("");
    setDatetimeInput("");
    setZones(DEFAULT_ZONES);
  }

  function handleEpochInput(value: string) {
    setEpochInput(value);
    const p = parseEpoch(value);
    if (p) {
      setDatetimeInput(msToLocalInput(p.ms));
    }
  }

  function handleDatetimeInput(value: string) {
    setDatetimeInput(value);
    const ms = localInputToMs(value);
    if (ms !== null) {
      setEpochInput(String(Math.floor(ms / 1000)));
    }
  }

  function changeZone(index: number, tz: string) {
    setZones((prev) => prev.map((z, i) => (i === index ? { ...z, tz } : z)));
  }

  return (
    <div class="flex flex-col gap-5 p-6 mx-auto w-full max-w-[760px]">
      {/* ------------------------------------------------------------------ */}
      {/* Input row                                                           */}
      {/* ------------------------------------------------------------------ */}
      <div class="grid grid-cols-[1fr_auto_1fr] gap-4 items-end">
        {/* Epoch input */}
        <div class="flex flex-col gap-1.5">
          <Label>Unix timestamp</Label>
          <Input
            type="text"
            value={epochInput()}
            onInput={handleEpochInput}
            placeholder="e.g. 1700000000"
          />
          <Show when={parsed()}>
            {(p) => (
              <span class="text-xs text-[var(--text-muted)]">
                Detected: {p().unit === "s" ? "seconds" : "milliseconds"}
              </span>
            )}
          </Show>
        </div>

        <div class="flex gap-2 items-center">
          <ToolActionButton onClick={useNow} variant="primary">
            Use now
          </ToolActionButton>
          <ToolActionButton onClick={reset} variant="ghost">
            Reset
          </ToolActionButton>
        </div>

        {/* Datetime-local input */}
        <div class="flex flex-col gap-1.5">
          <Label>Date & time (local)</Label>
          <Input type="datetime-local" value={datetimeInput()} onInput={handleDatetimeInput} />
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Derived epoch values                                                */}
      {/* ------------------------------------------------------------------ */}
      <Show when={date()}>
        {(d) => (
          <div class="flex gap-3 flex-wrap">
            {/* Seconds */}
            <Card class="flex-1 min-w-[160px]">
              <Label>Epoch (seconds)</Label>
              <div class="flex items-center gap-2 mt-1.5">
                <code class="text-[0.9375rem] text-[var(--accent-primary)] font-mono flex-1 break-all">
                  {String(Math.floor(d().getTime() / 1000))}
                </code>
                <CopyButton text={String(Math.floor(d().getTime() / 1000))} />
              </div>
            </Card>

            {/* Milliseconds */}
            <Card class="flex-1 min-w-[160px]">
              <Label>Epoch (milliseconds)</Label>
              <div class="flex items-center gap-2 mt-1.5">
                <code class="text-[0.9375rem] text-[var(--accent-primary)] font-mono flex-1 break-all">
                  {String(d().getTime())}
                </code>
                <CopyButton text={String(d().getTime())} />
              </div>
            </Card>

            {/* ISO 8601 */}
            <Card class="flex-[2] min-w-[220px]">
              <Label>ISO 8601</Label>
              <div class="flex items-center gap-2 mt-1.5">
                <code class="text-sm text-[var(--accent-success)] font-mono flex-1 break-all">
                  {d().toISOString()}
                </code>
                <CopyButton text={d().toISOString()} />
              </div>
            </Card>
          </div>
        )}
      </Show>

      {/* ------------------------------------------------------------------ */}
      {/* Derived formats                                                     */}
      {/* ------------------------------------------------------------------ */}
      <Show when={date()}>
        {(d) => (
          <Card class="overflow-hidden p-0">
            <div class="px-4 py-2.5 border-b border-[var(--border)]">
              <Label>Derived formats</Label>
            </div>

            <div class="p-3 grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-3">
              <For each={getDerivedTimestampFormats(d())}>
                {(item) => (
                  <div class="flex flex-col gap-1.5 p-3 bg-[var(--bg-primary)] border border-[var(--border)] rounded">
                    <Label>{item.label}</Label>
                    <code class="text-[0.8125rem] text-[var(--text-primary)] font-mono break-all">
                      {item.value}
                    </code>
                    <div class="flex justify-end">
                      <CopyButton text={item.value} />
                    </div>
                  </div>
                )}
              </For>
            </div>
          </Card>
        )}
      </Show>

      {/* ------------------------------------------------------------------ */}
      {/* Timezone panel                                                      */}
      {/* ------------------------------------------------------------------ */}
      <Show when={date()}>
        {(d) => (
          <Card class="overflow-hidden p-0">
            <div class="px-4 py-2.5 border-b border-[var(--border)]">
              <Label>Timezone conversions</Label>
            </div>

            <div class="p-3 flex flex-col gap-3">
              <For each={zones()}>
                {(zone, i) => (
                  <div class="grid grid-cols-[180px_1fr_auto] gap-3 items-center">
                    <Select
                      value={zone.tz}
                      onChange={(tz) => changeZone(i(), tz)}
                      options={PRESET_ZONES.map((z) => ({ value: z.tz, label: z.label }))}
                    />

                    <code class="text-sm text-[var(--text-primary)] font-mono">
                      {formatInZone(d(), zone.tz)}
                    </code>

                    <CopyButton text={formatInZone(d(), zone.tz)} />
                  </div>
                )}
              </For>
            </div>
          </Card>
        )}
      </Show>

      {/* Empty hint */}
      <Show when={!epochInput().trim() && !datetimeInput()}>
        <ToolStatusMessage tone="muted">
          Enter a Unix timestamp (seconds or ms auto-detected) or pick a date above
        </ToolStatusMessage>
      </Show>
    </div>
  );
}
