import {
  Binary,
  Braces,
  Clock,
  Fingerprint,
  GitCompare,
  KeyRound,
  Regex,
  Shuffle,
} from "lucide-solid";
import {
  createEffect,
  createMemo,
  createSignal,
  For,
  type JSX,
  onCleanup,
  onMount,
  Show,
} from "solid-js";

import { getToolRoute, tools } from "@/tools/registry";
import type { Tool } from "@/tools/registry";

const ICON_MAP: Record<string, (props: { size?: number; class?: string }) => JSX.Element> = {
  KeyRound: (p) => <KeyRound {...p} />,
  GitCompare: (p) => <GitCompare {...p} />,
  Binary: (p) => <Binary {...p} />,
  Braces: (p) => <Braces {...p} />,
  Fingerprint: (p) => <Fingerprint {...p} />,
  Shuffle: (p) => <Shuffle {...p} />,
  Clock: (p) => <Clock {...p} />,
  Regex: (p) => <Regex {...p} />,
};

/*
 * Relevance ordering for a developer audience.
 * Most frequently needed tools first, niche tools last.
 */
const RELEVANCE_ORDER: readonly string[] = [
  "json-formatter",
  "base64",
  "diff",
  "regex-tester",
  "jwt-decoder",
  "hash-generator",
  "uuid-generator",
  "timestamp",
];

const orderedTools: readonly Tool[] = [...tools].sort(
  (a, b) => RELEVANCE_ORDER.indexOf(a.id) - RELEVANCE_ORDER.indexOf(b.id)
);

export default function ToolSearch() {
  const [query, setQuery] = createSignal("");
  const [activeIndex, setActiveIndex] = createSignal(-1);
  const [focused, setFocused] = createSignal(false);
  const [mac, setMac] = createSignal(true);

  // eslint-disable-next-line no-unassigned-vars
  let inputRef: HTMLInputElement | undefined;

  const filtered = createMemo((): readonly Tool[] => {
    const q = query().toLowerCase().trim();
    if (!q) return orderedTools;
    return orderedTools.filter(
      (t) =>
        t.name.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q) ||
        t.keywords.some((k) => k.toLowerCase().includes(q))
    );
  });

  /* Reset selection when results change */
  createEffect(() => {
    filtered();
    setActiveIndex(-1);
  });

  /* Scroll the keyboard-selected row into view */
  createEffect(() => {
    const idx = activeIndex();
    if (idx < 0) return;
    const slug = filtered()[idx]?.slug;
    if (slug) {
      document.getElementById(`lp-tool-${slug}`)?.scrollIntoView({ block: "nearest" });
    }
  });

  onMount(() => {
    setMac(/Mac|iPhone|iPad/.test(navigator.userAgent));

    if (window.matchMedia("(pointer: fine)").matches) {
      inputRef?.focus();
    }

    /* Wire ⌘K / Ctrl+K to focus the inline search */
    function onGlobalKey(e: KeyboardEvent) {
      const mod = mac() ? e.metaKey : e.ctrlKey;
      if (mod && e.key === "k") {
        e.preventDefault();
        inputRef?.focus();
        inputRef?.select();
      }
    }

    document.addEventListener("keydown", onGlobalKey);
    onCleanup(() => document.removeEventListener("keydown", onGlobalKey));
  });

  function onKeyDown(e: KeyboardEvent) {
    const count = filtered().length;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setActiveIndex((i) => Math.min(i + 1, count - 1));
        break;

      case "ArrowUp":
        e.preventDefault();
        setActiveIndex((i) => Math.max(i - 1, -1));
        break;

      case "Enter":
        if (activeIndex() >= 0) {
          e.preventDefault();
          const tool = filtered()[activeIndex()];
          if (tool) window.location.href = getToolRoute(tool.slug);
        }
        break;

      case "Escape":
        setQuery("");
        inputRef?.blur();
        break;
    }
  }

  return (
    <div class="lp">
      {/* ── Search input ── */}
      <div classList={{ "lp-search": true, "lp-search--focused": focused() }}>
        <svg
          class="lp-search-icon"
          width="15"
          height="15"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
        >
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.35-4.35" />
        </svg>

        <input
          ref={inputRef}
          class="lp-search-input"
          type="text"
          placeholder="search tools…"
          value={query()}
          onInput={(e) => setQuery(e.currentTarget.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          onKeyDown={onKeyDown}
          autocomplete="off"
          spellcheck={false}
          aria-label="Search tools"
          role="combobox"
          aria-expanded="true"
          aria-controls="lp-results"
          aria-activedescendant={
            activeIndex() >= 0 ? `lp-tool-${filtered()[activeIndex()]?.slug ?? ""}` : undefined
          }
        />

        <Show when={query().length > 0}>
          <button
            class="lp-search-clear"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => {
              setQuery("");
              inputRef?.focus();
            }}
            aria-label="Clear search"
          >
            ×
          </button>
        </Show>

        <Show when={query().length === 0 && !focused()}>
          <span class="lp-search-hint">
            <kbd>{mac() ? "⌘" : "Ctrl+"}</kbd>
            <kbd>K</kbd>
          </span>
        </Show>
      </div>

      {/* ── Filtered results ── */}
      <div class="lp-results" id="lp-results" role="listbox">
        <Show
          when={filtered().length > 0}
          fallback={<p class="lp-empty">no tools match &ldquo;{query()}&rdquo;</p>}
        >
          <For each={filtered()}>
            {(tool, idx) => {
              const Icon = ICON_MAP[tool.icon];
              return (
                <a
                  href={getToolRoute(tool.slug)}
                  classList={{
                    "lp-row": true,
                    "lp-row--active": activeIndex() === idx(),
                  }}
                  id={`lp-tool-${tool.slug}`}
                  role="option"
                  aria-selected={activeIndex() === idx()}
                  onMouseEnter={() => setActiveIndex(idx())}
                  onMouseLeave={() => setActiveIndex(-1)}
                >
                  <span class="lp-row-icon">{Icon ? <Icon size={15} /> : null}</span>
                  <span class="lp-row-name">
                    {tool.name}
                    <Show when={tool.isNew}>
                      <span class="lp-badge">new</span>
                    </Show>
                  </span>
                  <span class="lp-row-cat">{tool.category}</span>
                  <span class="lp-row-desc">{tool.description}</span>
                </a>
              );
            }}
          </For>
        </Show>
      </div>
    </div>
  );
}
