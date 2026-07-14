import { Check, Clipboard } from "lucide-solid";
import { createSignal, onCleanup } from "solid-js";

import { copyToClipboard } from "@/lib/clipboard";

const COPY_FEEDBACK_DURATION_MS = 2000;

interface CopyButtonProps {
  text: string;
  label?: string;
}

export default function CopyButton(props: CopyButtonProps) {
  const [copied, setCopied] = createSignal(false);
  let copyTimer: ReturnType<typeof setTimeout> | undefined;
  onCleanup(() => clearTimeout(copyTimer));

  async function handleCopy() {
    const success = await copyToClipboard(props.text);
    if (success) {
      clearTimeout(copyTimer);
      setCopied(true);
      copyTimer = setTimeout(() => setCopied(false), COPY_FEEDBACK_DURATION_MS);
    }
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      class="inline-flex items-center gap-1.5 rounded border px-2.5 py-1 text-xs font-medium transition-colors"
      style={{
        "background-color": "var(--bg-secondary)",
        "border-color": "var(--border)",
        color: "var(--accent-primary)",
      }}
      aria-label={copied() ? "Copied!" : (props.label ?? "Copy")}
    >
      {copied() ? (
        <>
          <Check size={12} />
          Copied!
        </>
      ) : (
        <>
          <Clipboard size={12} />
          {props.label ?? "Copy"}
        </>
      )}
    </button>
  );
}
