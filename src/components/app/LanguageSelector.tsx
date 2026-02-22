import React from "react";

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

export default function LanguageSelector({ value, onChange, id }: Props) {
  return (
    <select
      id={id}
      value={value}
      onChange={(e) => onChange(e.target.value as Language)}
      className="rounded border border-slate-700 bg-slate-800 px-2 py-1 text-xs text-slate-300 focus:border-indigo-500 focus:outline-none"
      aria-label="Select language"
    >
      {LANGUAGES.map((lang) => (
        <option key={lang.value} value={lang.value}>
          {lang.label}
        </option>
      ))}
    </select>
  );
}
