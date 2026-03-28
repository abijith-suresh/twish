import { For } from "solid-js";
import { type Language, SUPPORTED_LANGUAGES } from "@/lib/language";

export const LANGUAGES = [
  { value: SUPPORTED_LANGUAGES[0], label: "Plain text" },
  { value: SUPPORTED_LANGUAGES[1], label: "JSON" },
  { value: SUPPORTED_LANGUAGES[2], label: "YAML" },
  { value: SUPPORTED_LANGUAGES[3], label: "JavaScript" },
  { value: SUPPORTED_LANGUAGES[4], label: "TypeScript" },
  { value: SUPPORTED_LANGUAGES[5], label: "Python" },
  { value: SUPPORTED_LANGUAGES[6], label: "Markdown" },
  { value: SUPPORTED_LANGUAGES[7], label: "XML" },
  { value: SUPPORTED_LANGUAGES[8], label: "HTML" },
];

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
