import { createSignal, onCleanup, onMount, Show } from "solid-js";
import DiffView from "./DiffView";
import EditorPanel from "./EditorPanel";
import Toolbar from "./Toolbar";
import { type Language } from "./LanguageSelector";

interface DiffState {
  original: string;
  modified: string;
}

export default function DiffApp() {
  const [leftContent, setLeftContent] = createSignal("");
  const [rightContent, setRightContent] = createSignal("");
  const [leftLang, setLeftLang] = createSignal<Language>("text");
  const [rightLang, setRightLang] = createSignal<Language>("text");
  const [diffResult, setDiffResult] = createSignal<DiffState | null>(null);

  function handleCompare() {
    setDiffResult({ original: leftContent(), modified: rightContent() });
  }

  function handleSwap() {
    const prevLeft = leftContent();
    const prevRight = rightContent();
    const prevLeftLang = leftLang();
    const prevRightLang = rightLang();
    setLeftContent(prevRight);
    setRightContent(prevLeft);
    setLeftLang(prevRightLang);
    setRightLang(prevLeftLang);
    if (diffResult()) {
      setDiffResult({ original: prevRight, modified: prevLeft });
    }
  }

  function handleClear() {
    setLeftContent("");
    setRightContent("");
    setDiffResult(null);
  }

  onMount(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.ctrlKey && e.key === "Enter") {
        e.preventDefault();
        handleCompare();
      }
      if (e.ctrlKey && e.shiftKey && e.key === "C") {
        e.preventDefault();
        handleClear();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    onCleanup(() => document.removeEventListener("keydown", handleKeyDown));
  });

  return (
    <div class="diff-app">
      {/* Editor row */}
      <div class="diff-editors">
        <div class="diff-panel">
          <EditorPanel
            label="Original"
            value={leftContent()}
            language={leftLang()}
            onValueChange={setLeftContent}
            onLanguageChange={setLeftLang}
            panelId="left"
          />
        </div>
        <div class="diff-panel diff-panel--right">
          <EditorPanel
            label="Modified"
            value={rightContent()}
            language={rightLang()}
            onValueChange={setRightContent}
            onLanguageChange={setRightLang}
            panelId="right"
          />
        </div>
      </div>

      {/* Toolbar */}
      <Toolbar onCompare={handleCompare} onSwap={handleSwap} onClear={handleClear} />

      {/* Diff output */}
      <Show when={diffResult()}>
        {(result) => (
          <div class="diff-output">
            <DiffView original={result().original} modified={result().modified} />
          </div>
        )}
      </Show>

      <Show when={!diffResult()}>
        <div class="diff-hint">
          Paste or drop content above, then click Compare or press Ctrl+Enter.
        </div>
      </Show>
    </div>
  );
}
