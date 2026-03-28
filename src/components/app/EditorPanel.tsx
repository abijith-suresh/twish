import { catppuccinMocha } from "@catppuccin/codemirror";
import { Compartment, EditorState, type Extension } from "@codemirror/state";
import { basicSetup, EditorView } from "codemirror";
import { createEffect, createSignal, onCleanup, onMount, Show } from "solid-js";
import { detectLanguage } from "@/lib/languageDetection";
import { type Language } from "@/lib/language";
import LanguageSelector from "./LanguageSelector";

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

const BINARY_EXTENSIONS = [
  ".png",
  ".jpg",
  ".jpeg",
  ".gif",
  ".svg",
  ".pdf",
  ".zip",
  ".exe",
  ".bin",
  ".wasm",
  ".ico",
  ".webp",
  ".mp3",
  ".mp4",
  ".mov",
];

interface Props {
  label: string;
  value: string;
  language: Language;
  onValueChange: (val: string) => void;
  onLanguageChange: (lang: Language) => void;
  panelId: string;
  onFocus?: () => void;
  onRegisterOpenFile?: (fn: () => void) => void;
  onFileOpen?: (name: string) => void;
  focused?: boolean;
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
  const wrapCompartment = new Compartment();
  const [langLoading, setLangLoading] = createSignal(false);
  const [dragging, setDragging] = createSignal(false);
  const [dropError, setDropError] = createSignal<string | null>(null);
  const [wordWrap, setWordWrap] = createSignal(false);

  function loadFile(file: File) {
    const ext = "." + (file.name.split(".").pop()?.toLowerCase() ?? "");
    if (BINARY_EXTENSIONS.includes(ext)) {
      setDropError(`Cannot compare binary file: ${file.name}`);
      setTimeout(() => setDropError(null), 4000);
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result;
      if (typeof text === "string") {
        props.onValueChange(text);
        props.onLanguageChange(detectLanguage({ filename: file.name, content: text }));
        props.onFileOpen?.(file.name);
      }
    };
    reader.readAsText(file);
  }

  function handleDragOver(e: DragEvent) {
    e.preventDefault();
    if (!dragging()) {
      setDragging(true);
      dropOverlay.style.display = "flex";
    }
  }

  function handleDragLeave(e: DragEvent) {
    // Only dismiss if leaving the panel entirely (not entering a child element)
    if (
      !e.currentTarget ||
      !(e.currentTarget as Element).contains(e.relatedTarget as Node | null)
    ) {
      setDragging(false);
      dropOverlay.style.display = "none";
    }
  }

  function handleDrop(e: DragEvent) {
    e.preventDefault();
    setDragging(false);
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

    // Initialize with empty compartments; the createEffect below
    // async-loads the initial language pack on first run.
    const state = EditorState.create({
      doc: props.value,
      extensions: [
        basicSetup,
        catppuccinMocha,
        langCompartment.of([]),
        wrapCompartment.of([]),
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

  // Lazily swap the language extension whenever the selected mode changes.
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

  // Toggle line wrapping via compartment
  createEffect(() => {
    if (view) {
      view.dispatch({
        effects: wrapCompartment.reconfigure(wordWrap() ? EditorView.lineWrapping : []),
      });
    }
  });

  return (
    <div
      class={["editor-panel min-w-[260px]", props.focused ? "ring-1 ring-cat-blue/50" : ""].join(
        " "
      )}
    >
      {/* Panel header */}
      <div class="editor-header">
        <span class="editor-label">{props.label}</span>
        <LanguageSelector
          id={`lang-${props.panelId}`}
          value={props.language}
          onChange={props.onLanguageChange}
          loading={langLoading()}
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

        {/* Drop / binary error toast */}
        <Show when={dropError()}>
          <div
            role="alert"
            class="absolute bottom-8 left-0 right-0 mx-4 bg-cat-surface0 border border-cat-red text-cat-red text-xs px-3 py-2 rounded"
          >
            {dropError()}
          </div>
        </Show>
      </div>

      {/* Open file footer */}
      <div class="editor-footer flex items-center gap-3">
        <button
          type="button"
          onClick={() => fileInputEl.click()}
          class="text-cat-subtext0 hover:text-cat-text underline-offset-2 hover:underline text-xs flex items-center gap-1 transition-colors bg-transparent border-none cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cat-blue focus-visible:ring-offset-1 focus-visible:ring-offset-cat-base font-mono"
        >
          📂 Open file…
          <kbd class="ml-1 px-1 text-[10px] bg-cat-surface0 border border-cat-surface1 rounded font-mono not-italic">
            Ctrl+O
          </kbd>
        </button>

        {/* Word wrap toggle */}
        <button
          type="button"
          onClick={() => setWordWrap((v) => !v)}
          title="Toggle line wrap"
          class={[
            "text-xs px-2 py-0.5 border rounded-sm transition-colors font-mono bg-transparent cursor-pointer",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cat-blue focus-visible:ring-offset-1 focus-visible:ring-offset-cat-base",
            wordWrap()
              ? "border-cat-blue text-cat-blue"
              : "border-cat-surface1 text-cat-overlay0 hover:border-cat-subtext0 hover:text-cat-subtext0",
          ].join(" ")}
        >
          wrap
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
