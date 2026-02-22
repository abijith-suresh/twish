import CodeMirror from "@uiw/react-codemirror";
import { vscodeDark } from "@uiw/codemirror-theme-vscode";
import { json } from "@codemirror/lang-json";
import { javascript } from "@codemirror/lang-javascript";
import { python } from "@codemirror/lang-python";
import { markdown } from "@codemirror/lang-markdown";
import { xml } from "@codemirror/lang-xml";
import React, { useCallback, useRef, useState } from "react";
import LanguageSelector, { type Language } from "./LanguageSelector";
import { type Extension } from "@codemirror/state";

function getExtensions(lang: Language): Extension[] {
  switch (lang) {
    case "json":
      return [json()];
    case "javascript":
      return [javascript()];
    case "typescript":
      return [javascript({ typescript: true })];
    case "python":
      return [python()];
    case "markdown":
      return [markdown()];
    case "xml":
    case "html":
      return [xml()];
    default:
      return [];
  }
}

interface Props {
  label: string;
  value: string;
  language: Language;
  onValueChange: (val: string) => void;
  onLanguageChange: (lang: Language) => void;
  panelId: string;
}

export default function EditorPanel({
  label,
  value,
  language,
  onValueChange,
  onLanguageChange,
  panelId,
}: Props) {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadFile = useCallback(
    (file: File) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result;
        if (typeof text === "string") {
          onValueChange(text);
        }
      };
      reader.readAsText(file);
    },
    [onValueChange]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) loadFile(file);
    },
    [loadFile]
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) loadFile(file);
      // reset so the same file can be re-opened
      e.target.value = "";
    },
    [loadFile]
  );

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {/* Panel header */}
      <div className="flex shrink-0 items-center justify-between border-b border-slate-700 bg-slate-900 px-3 py-2">
        <span className="text-xs font-semibold text-slate-300">{label}</span>
        <LanguageSelector id={`lang-${panelId}`} value={language} onChange={onLanguageChange} />
      </div>

      {/* Drop zone + editor */}
      <div
        className="relative min-h-0 flex-1"
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {isDragging && (
          <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center rounded border-2 border-dashed border-indigo-500 bg-indigo-950/70">
            <span className="text-sm font-medium text-indigo-300">Drop file here</span>
          </div>
        )}

        <CodeMirror
          value={value}
          onChange={onValueChange}
          theme={vscodeDark}
          extensions={getExtensions(language)}
          className="h-full text-sm"
          style={{ height: "100%" }}
          basicSetup={{
            lineNumbers: true,
            foldGutter: true,
            highlightActiveLine: true,
          }}
        />
      </div>

      {/* Open file button */}
      <div className="shrink-0 border-t border-slate-800 px-3 py-1.5">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="text-xs text-slate-500 transition-colors hover:text-slate-300"
        >
          Open file…
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="text/*,.json,.yaml,.yml,.toml,.ini,.env,.ts,.tsx,.js,.jsx,.py,.md,.xml,.html,.css"
          className="sr-only"
          onChange={handleFileInput}
          aria-label={`Open file for ${label} panel`}
        />
      </div>
    </div>
  );
}
