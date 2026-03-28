import { For } from "solid-js";
import { type Language } from "@/lib/language";

export const LANGUAGES: { value: Language; label: string }[] = [
  { value: "text", label: "Plain text" },
  { value: "json", label: "JSON" },
  { value: "yaml", label: "YAML" },
  { value: "env", label: ".env" },
  { value: "javascript", label: "JavaScript" },
  { value: "typescript", label: "TypeScript" },
  { value: "python", label: "Python" },
  { value: "markdown", label: "Markdown" },
  { value: "xml", label: "XML" },
  { value: "html", label: "HTML" },
];

interface Props {
  value: Language;
  onChange: (lang: Language) => void;
  id: string;
  loading?: boolean;
}

export default function LanguageSelector(props: Props) {
  return (
    <select
      id={props.id}
      value={props.value}
      disabled={props.loading}
      onChange={(e) => props.onChange(e.target.value as Language)}
      class={`lang-select${props.loading ? " opacity-50 cursor-not-allowed" : ""}`}
      aria-label="Select language"
    >
      <For each={LANGUAGES}>{(lang) => <option value={lang.value}>{lang.label}</option>}</For>
    </select>
  );
}
