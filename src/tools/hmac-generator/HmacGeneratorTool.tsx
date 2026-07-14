import { createSignal, Show } from "solid-js";

import CopyButton from "@/components/CopyButton";
import Card from "@/components/primitives/solid/Card";
import Label from "@/components/primitives/solid/Label";
import Select from "@/components/primitives/solid/Select";
import Textarea from "@/components/primitives/solid/Textarea";
import ToolActionButton from "@/components/ToolActionButton";
import ToolStatusMessage from "@/components/ToolStatusMessage";
import { generateHmac, HMAC_ALGORITHMS, type HmacAlgorithm } from "@/lib/hmac";

export default function HmacGeneratorTool() {
  const [message, setMessage] = createSignal("");
  const [secret, setSecret] = createSignal("");
  const [algorithm, setAlgorithm] = createSignal<HmacAlgorithm>("SHA-256");
  const [output, setOutput] = createSignal("");
  const [error, setError] = createSignal("");
  const [pending, setPending] = createSignal(false);

  async function handleGenerate() {
    setPending(true);
    const result = await generateHmac({
      message: message(),
      secret: secret(),
      algorithm: algorithm(),
    });
    setPending(false);

    if (result.ok) {
      setOutput(result.output);
      setError("");
      return;
    }

    setOutput("");
    setError(result.error);
  }

  return (
    <div class="flex flex-col gap-5 p-6 mx-auto w-full max-w-[900px]">
      <div class="grid gap-4 grid-cols-[repeat(auto-fit,minmax(260px,1fr))]">
        <Textarea label="Message" value={message()} onInput={(v) => setMessage(v)} rows={6} />
        <Textarea label="Secret" value={secret()} onInput={(v) => setSecret(v)} rows={6} />
      </div>

      <div class="flex gap-3 flex-wrap items-center">
        <Select
          label="Algorithm"
          value={algorithm()}
          onChange={(v) => setAlgorithm(v as HmacAlgorithm)}
          options={HMAC_ALGORITHMS.map((a) => ({ value: a.id, label: a.label }))}
        />
        <ToolActionButton
          onClick={() => void handleGenerate()}
          variant="primary"
          disabled={pending()}
        >
          {pending() ? "Generating…" : "Generate HMAC"}
        </ToolActionButton>
      </div>

      <Show when={error()}>
        {(message) => <ToolStatusMessage tone="error">{message()}</ToolStatusMessage>}
      </Show>

      <Card>
        <div class="flex items-center justify-between">
          <Label>Hex output</Label>
          <CopyButton text={output()} label="Copy HMAC" />
        </div>
        <code class="text-[var(--text-primary)] text-[0.95rem] leading-relaxed font-mono break-all min-h-[3rem] block">
          {output() || "—"}
        </code>
      </Card>

      <ToolStatusMessage tone="muted">
        Secrets remain in memory only and are processed with the browser&apos;s Web Crypto API.
      </ToolStatusMessage>
    </div>
  );
}
