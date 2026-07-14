import Label from "@/components/primitives/solid/Label";
import { cn } from "@/lib/cn";

export interface InputProps {
  label?: string;
  value?: string;
  onInput?: (value: string) => void;
  placeholder?: string;
  type?: string;
  class?: string;
  id?: string;
}

export default function Input(props: InputProps) {
  return (
    <div class={cn("flex flex-col gap-1.5", props.class)}>
      {props.label ? <Label for={props.id}>{props.label}</Label> : null}
      <input
        id={props.id}
        type={props.type ?? "text"}
        value={props.value ?? ""}
        onInput={(e) => props.onInput?.((e.target as HTMLInputElement).value)}
        placeholder={props.placeholder}
        class="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] px-4 py-2.5 text-sm text-[var(--text-primary)] outline-none font-mono focus:border-[var(--accent-primary)]"
      />
    </div>
  );
}
