import Label from "@/components/primitives/solid/Label";
import { cn } from "@/lib/cn";

interface SelectOption {
  value: string;
  label: string;
}

export interface SelectProps {
  label?: string;
  value?: string;
  onChange?: (value: string) => void;
  options?: SelectOption[];
  class?: string;
  id?: string;
}

export default function Select(props: SelectProps) {
  return (
    <div class={cn("flex flex-col gap-1.5", props.class)}>
      {props.label ? <Label for={props.id}>{props.label}</Label> : null}
      <select
        id={props.id}
        value={props.value ?? ""}
        onChange={(e) => props.onChange?.((e.target as HTMLSelectElement).value)}
        class="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] px-4 py-2.5 text-sm text-[var(--text-primary)] outline-none font-mono focus:border-[var(--accent-primary)]"
      >
        {props.options?.map((opt) => (
          <option value={opt.value}>{opt.label}</option>
        ))}
      </select>
    </div>
  );
}
