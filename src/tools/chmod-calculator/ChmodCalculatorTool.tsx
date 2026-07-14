import { createMemo, createSignal, For } from "solid-js";

import CopyButton from "@/components/CopyButton";
import Card from "@/components/primitives/solid/Card";
import Label from "@/components/primitives/solid/Label";
import { buildChmodResult, type ChmodPermissions } from "@/lib/chmod";

const SUBJECTS = [
  ["owner", "Owner"],
  ["group", "Group"],
  ["other", "Other"],
] as const satisfies ReadonlyArray<readonly [keyof ChmodPermissions, string]>;

const PERMISSIONS = [
  ["read", "Read"],
  ["write", "Write"],
  ["execute", "Execute"],
] as const;

const DEFAULT_PERMISSIONS: ChmodPermissions = {
  owner: { read: true, write: true, execute: true },
  group: { read: true, write: false, execute: true },
  other: { read: true, write: false, execute: true },
};

export default function ChmodCalculatorTool() {
  const [permissions, setPermissions] = createSignal<ChmodPermissions>(DEFAULT_PERMISSIONS);
  const result = createMemo(() => buildChmodResult(permissions()));

  function togglePermission(
    subject: keyof ChmodPermissions,
    permission: keyof ChmodPermissions["owner"]
  ) {
    setPermissions((current) => ({
      ...current,
      [subject]: {
        ...current[subject],
        [permission]: !current[subject][permission],
      },
    }));
  }

  return (
    <div class="flex flex-col gap-5 p-6 mx-auto w-full max-w-[900px]">
      <Card class="overflow-auto">
        <table class="w-full border-collapse">
          <thead>
            <tr>
              <th class="px-4 py-3 text-left">
                <Label>Scope</Label>
              </th>
              <For each={PERMISSIONS}>
                {([_, label]) => (
                  <th class="px-4 py-3 text-left">
                    <Label>{label}</Label>
                  </th>
                )}
              </For>
            </tr>
          </thead>
          <tbody>
            <For each={SUBJECTS}>
              {([subject, label]) => (
                <tr>
                  <td class="px-4 py-3 text-[var(--text-primary)]">{label}</td>
                  <For each={PERMISSIONS}>
                    {([permission]) => (
                      <td class="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={permissions()[subject][permission]}
                          onChange={() => togglePermission(subject, permission)}
                        />
                      </td>
                    )}
                  </For>
                </tr>
              )}
            </For>
          </tbody>
        </table>
      </Card>

      <div class="grid gap-3 grid-cols-[repeat(auto-fit,minmax(220px,1fr))]">
        <Card>
          <div class="flex justify-between gap-3">
            <Label>Octal mode</Label>
            <CopyButton text={result().octal} label="Copy octal" />
          </div>
          <strong class="text-[var(--text-primary)] text-2xl">{result().octal}</strong>
        </Card>

        <Card>
          <div class="flex justify-between gap-3">
            <Label>Symbolic mode</Label>
            <CopyButton text={result().symbolic} label="Copy symbolic" />
          </div>
          <strong class="text-[var(--text-primary)] text-2xl">{result().symbolic}</strong>
        </Card>

        <Card>
          <div class="flex justify-between gap-3">
            <Label>Command</Label>
            <CopyButton text={result().command} label="Copy command" />
          </div>
          <code class="text-[var(--text-primary)] text-[0.95rem]">{result().command}</code>
        </Card>
      </div>
    </div>
  );
}
