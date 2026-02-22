import React, { useCallback, useEffect, useRef, useState } from "react";
import DiffView from "./DiffView";
import EditorPanel from "./EditorPanel";
import Toolbar from "./Toolbar";
import { type Language } from "./LanguageSelector";

interface DiffState {
  original: string;
  modified: string;
}

export default function DiffApp() {
  const [leftContent, setLeftContent] = useState("");
  const [rightContent, setRightContent] = useState("");
  const [leftLang, setLeftLang] = useState<Language>("text");
  const [rightLang, setRightLang] = useState<Language>("text");
  const [diffResult, setDiffResult] = useState<DiffState | null>(null);

  // Track which panel is "focused" for Ctrl+O
  const focusedPanel = useRef<"left" | "right">("left");

  const handleCompare = useCallback(() => {
    setDiffResult({ original: leftContent, modified: rightContent });
  }, [leftContent, rightContent]);

  const handleSwap = useCallback(() => {
    setLeftContent(rightContent);
    setRightContent(leftContent);
    setLeftLang(rightLang);
    setRightLang(leftLang);
    // Re-run diff with swapped contents if diff is visible
    if (diffResult) {
      setDiffResult({ original: rightContent, modified: leftContent });
    }
  }, [leftContent, rightContent, leftLang, rightLang, diffResult]);

  const handleClear = useCallback(() => {
    setLeftContent("");
    setRightContent("");
    setDiffResult(null);
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === "Enter") {
        e.preventDefault();
        handleCompare();
      }
      if (e.ctrlKey && e.shiftKey && e.key === "C") {
        e.preventDefault();
        handleClear();
      }
      // Ctrl+O is handled natively by the EditorPanel's file input
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleCompare, handleClear]);

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Editor row */}
      <div className="flex min-h-0 flex-1 divide-x divide-slate-700 overflow-hidden">
        <div
          className="min-h-0 flex-1"
          onFocus={() => {
            focusedPanel.current = "left";
          }}
        >
          <EditorPanel
            label="Original"
            value={leftContent}
            language={leftLang}
            onValueChange={setLeftContent}
            onLanguageChange={setLeftLang}
            panelId="left"
          />
        </div>
        <div
          className="min-h-0 flex-1"
          onFocus={() => {
            focusedPanel.current = "right";
          }}
        >
          <EditorPanel
            label="Modified"
            value={rightContent}
            language={rightLang}
            onValueChange={setRightContent}
            onLanguageChange={setRightLang}
            panelId="right"
          />
        </div>
      </div>

      {/* Toolbar */}
      <Toolbar onCompare={handleCompare} onSwap={handleSwap} onClear={handleClear} />

      {/* Diff output */}
      {diffResult && (
        <div className="min-h-0 flex-1 overflow-auto border-t border-slate-800">
          <DiffView original={diffResult.original} modified={diffResult.modified} />
        </div>
      )}

      {!diffResult && (
        <div className="flex shrink-0 items-center justify-center py-6 text-xs text-slate-600">
          Paste or drop content above, then click Compare or press Ctrl+Enter.
        </div>
      )}
    </div>
  );
}
