import { For } from "solid-js";

export const LANGUAGES = [
  { value: "text", label: "Plain text" },
  { value: "json", label: "JSON" },
  { value: "yaml", label: "YAML" },
  { value: "javascript", label: "JavaScript" },
  { value: "typescript", label: "TypeScript" },
  { value: "python", label: "Python" },
  { value: "markdown", label: "Markdown" },
  { value: "xml", label: "XML" },
  { value: "html", label: "HTML" },
] as const;

export type Language = (typeof LANGUAGES)[number]["value"];

interface Props {
  value: Language;
  onChange: (lang: Language) => void;
  id: string;
}

export default function LanguageSelector(props: Props) {
  return (
    <select
      id={props.id}
      value={props.value}
      onChange={(e) => props.onChange(e.target.value as Language)}
      class="lang-select"
      aria-label="Select language"
    >
      <For each={LANGUAGES}>{(lang) => <option value={lang.value}>{lang.label}</option>}</For>
    </select>
  );
}
