import { Compartment, EditorState, type Extension } from "@codemirror/state";
import { vscodeDark } from "@uiw/codemirror-theme-vscode";
import { basicSetup, EditorView } from "codemirror";
import { createEffect, createSignal, onCleanup, onMount, Show } from "solid-js";
import LanguageSelector, { type Language } from "./LanguageSelector";

async function loadExtensions(lang: Language): Promise<Extension[]> {
  switch (lang) {
    case "json": {
      const { json } = await import("@codemirror/lang-json");
      return [json()];
    }
    case "yaml": {
      const { yaml } = await import("@codemirror/lang-yaml");
      return [yaml()];
    }
    case "javascript": {
      const { javascript } = await import("@codemirror/lang-javascript");
      return [javascript()];
    }
    case "typescript": {
      const { javascript } = await import("@codemirror/lang-javascript");
      return [javascript({ typescript: true })];
    }
    case "python": {
      const { python } = await import("@codemirror/lang-python");
      return [python()];
    }
    case "markdown": {
      const { markdown } = await import("@codemirror/lang-markdown");
      return [markdown()];
    }
    case "xml":
    case "html": {
      const { xml } = await import("@codemirror/lang-xml");
      return [xml()];
    }
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
  onFocus?: () => void;
  onRegisterOpenFile?: (fn: () => void) => void;
}

export default function EditorPanel(props: Props) {
  // eslint-disable-next-line no-unassigned-vars
  let container!: HTMLDivElement;
  let view: EditorView | undefined;
  // eslint-disable-next-line no-unassigned-vars
  let dropOverlay!: HTMLDivElement;
  // eslint-disable-next-line no-unassigned-vars
  let fileInputEl!: HTMLInputElement;
  const langCompartment = new Compartment();
  const [langLoading, setLangLoading] = createSignal(false);
  let dragging = false;

  function loadFile(file: File) {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result;
      if (typeof text === "string") {
        props.onValueChange(text);
      }
    };
    reader.readAsText(file);
  }

  function handleDragOver(e: DragEvent) {
    e.preventDefault();
    if (!dragging) {
      dragging = true;
      dropOverlay.style.display = "flex";
    }
  }

  function handleDragLeave() {
    dragging = false;
    dropOverlay.style.display = "none";
  }

  function handleDrop(e: DragEvent) {
    e.preventDefault();
    dragging = false;
    dropOverlay.style.display = "none";
    const file = e.dataTransfer?.files[0];
    if (file) loadFile(file);
  }

  function handleFileInput(e: Event) {
    const input = e.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file) loadFile(file);
    input.value = "";
  }

  onMount(() => {
    props.onRegisterOpenFile?.(() => fileInputEl.click());

    // Initialize with empty language compartment; the createEffect below
    // async-loads the initial language pack on first run.
    const state = EditorState.create({
      doc: props.value,
      extensions: [
        basicSetup,
        vscodeDark,
        langCompartment.of([]),
        EditorView.updateListener.of((update) => {
          if (update.docChanged) {
            props.onValueChange(update.state.doc.toString());
          }
        }),
      ],
    });
    view = new EditorView({ state, parent: container });
    onCleanup(() => view?.destroy());
  });

  // Reactively swap language extension (lazy-loaded per selection)
  createEffect(() => {
    const lang = props.language;
    setLangLoading(true);
    loadExtensions(lang).then((exts) => {
      if (view) {
        view.dispatch({ effects: langCompartment.reconfigure(exts) });
      }
      setLangLoading(false);
    });
  });

  // Sync external value changes (swap / clear) back into the editor
  createEffect(() => {
    const val = props.value;
    if (view && view.state.doc.toString() !== val) {
      view.dispatch({
        changes: { from: 0, to: view.state.doc.length, insert: val },
      });
    }
  });

  return (
    <div class="editor-panel">
      {/* Panel header */}
      <div class="editor-header">
        <span class="editor-label">{props.label}</span>
        <LanguageSelector
          id={`lang-${props.panelId}`}
          value={props.language}
          onChange={props.onLanguageChange}
        />
      </div>

      {/* Drop zone + editor */}
      <div
        class="editor-drop-zone"
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onFocusIn={props.onFocus}
      >
        <div ref={dropOverlay} class="editor-drop-overlay" style="display:none">
          <span class="editor-drop-label">Drop file here</span>
        </div>

        <Show when={langLoading()}>
          <div class="editor-lang-loading">Loading…</div>
        </Show>

        <div ref={container} class="editor-cm-host" />
      </div>

      {/* Open file footer */}
      <div class="editor-footer">
        <button type="button" onClick={() => fileInputEl.click()} class="editor-open-btn">
          Open file…
        </button>
        <input
          ref={fileInputEl}
          type="file"
          accept="text/*,.json,.yaml,.yml,.toml,.ini,.env,.ts,.tsx,.js,.jsx,.py,.md,.xml,.html,.css"
          class="sr-only"
          onChange={handleFileInput}
          aria-label={`Open file for ${props.label} panel`}
        />
      </div>
    </div>
  );
}
