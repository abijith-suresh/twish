import { createMemo, createSignal, Show } from "solid-js";

import CopyButton from "@/components/CopyButton";
import Card from "@/components/primitives/solid/Card";
import Label from "@/components/primitives/solid/Label";
import ToolActionButton from "@/components/ToolActionButton";
import ToolStatusMessage from "@/components/ToolStatusMessage";
import {
  DEFAULT_TOKEN_OPTIONS,
  generateToken,
  MAX_TOKEN_LENGTH,
  MIN_TOKEN_LENGTH,
  type TokenGeneratorOptions,
} from "@/lib/tokenGenerator";

function createInitialState() {
  const result = generateToken(DEFAULT_TOKEN_OPTIONS);
  return {
    token: result.ok ? result.token : "",
    error: result.ok ? "" : result.error,
  };
}

export default function TokenGenerator() {
  const initial = createInitialState();
  const [options, setOptions] = createSignal<TokenGeneratorOptions>(DEFAULT_TOKEN_OPTIONS);
  const [token, setToken] = createSignal(initial.token);
  const [error, setError] = createSignal(initial.error);

  const activeGroups = createMemo(() => {
    const current = options();
    return [
      current.uppercase && "uppercase",
      current.lowercase && "lowercase",
      current.digits && "digits",
      current.symbols && "symbols",
    ].filter(Boolean);
  });

  function regenerate(nextOptions: TokenGeneratorOptions = options()) {
    const result = generateToken(nextOptions);
    if (result.ok) {
      setToken(result.token);
      setError("");
      return;
    }

    setToken("");
    setError(result.error);
  }

  function updateOption<K extends keyof TokenGeneratorOptions>(
    key: K,
    value: TokenGeneratorOptions[K]
  ) {
    const next = { ...options(), [key]: value };
    setOptions(next);
    regenerate(next);
  }

  return (
    <div class="flex flex-col gap-5 p-6 mx-auto w-full max-w-[900px]">
      <div class="grid grid-cols-[2fr_1fr] gap-4">
        <Card class="flex flex-col gap-1.5">
          <div class="flex justify-between gap-3">
            <Label>Generated token</Label>
            <CopyButton text={token()} label="Copy token" />
          </div>
          <code class="text-[var(--text-primary)] text-base leading-relaxed font-mono break-all min-h-[4.5rem] block">
            {token() || "—"}
          </code>
        </Card>

        <Card class="flex flex-col gap-1.5">
          <Label>Options</Label>
          <label class="text-sm text-[var(--text-secondary)]" for="token-length">
            Length
          </label>
          <input
            id="token-length"
            type="number"
            min={MIN_TOKEN_LENGTH}
            max={MAX_TOKEN_LENGTH}
            value={options().length}
            onInput={(event) => updateOption("length", Number(event.currentTarget.value) || 0)}
            class="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-primary)] px-4 py-2.5 text-sm text-[var(--text-primary)] outline-none font-mono focus:border-[var(--accent-primary)]"
          />
          <ToolActionButton onClick={() => regenerate()} variant="primary">
            Regenerate
          </ToolActionButton>
        </Card>
      </div>

      <div class="flex gap-2 flex-wrap">
        <ToolActionButton
          active={options().uppercase}
          onClick={() => updateOption("uppercase", !options().uppercase)}
        >
          Uppercase
        </ToolActionButton>
        <ToolActionButton
          active={options().lowercase}
          onClick={() => updateOption("lowercase", !options().lowercase)}
        >
          Lowercase
        </ToolActionButton>
        <ToolActionButton
          active={options().digits}
          onClick={() => updateOption("digits", !options().digits)}
        >
          Digits
        </ToolActionButton>
        <ToolActionButton
          active={options().symbols}
          onClick={() => updateOption("symbols", !options().symbols)}
        >
          Symbols
        </ToolActionButton>
      </div>

      <Show when={error()}>
        {(message) => <ToolStatusMessage tone="error">{message()}</ToolStatusMessage>}
      </Show>

      <ToolStatusMessage tone="muted">
        Uses <code>crypto.getRandomValues()</code> locally with {activeGroups().length || "no"}{" "}
        character set{activeGroups().length === 1 ? "" : "s"} enabled.
      </ToolStatusMessage>
    </div>
  );
}
