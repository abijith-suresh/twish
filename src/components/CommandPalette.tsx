import {
  Binary,
  Braces,
  Clock,
  Fingerprint,
  GitCompare,
  KeyRound,
  Regex,
  Search,
  Settings,
  Shuffle,
} from "lucide-solid";
import { createEffect, createSignal, For, onCleanup, onMount, Show } from "solid-js";
import type { JSX } from "solid-js";

import { searchTools } from "@/lib/search";
import { getToolRoute, type Tool, tools } from "@/tools/registry";

// Map of lucide icon name → component
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

function ToolIcon(props: { name: string; size?: number; class?: string }) {
  const Icon = ICON_MAP[props.name];
  if (Icon) return <Icon size={props.size} class={props.class} />;
  return <Search size={props.size} class={props.class} />;
}

export default function CommandPalette() {
  const [open, setOpen] = createSignal(false);
  const [query, setQuery] = createSignal("");
  const [selectedIndex, setSelectedIndex] = createSignal(0);
  const [results, setResults] = createSignal<Tool[]>(tools);

  // Show Preferences command when query is empty or matches settings-related terms
  const showPreferences = () => query() === "" || /settings|preferences|theme|color/i.test(query());

  // Total navigable items = tool results + Preferences (when shown)
  const totalItems = () => results().length + (showPreferences() ? 1 : 0);

  // eslint-disable-next-line no-unassigned-vars
  let inputRef: HTMLInputElement | undefined;
  // eslint-disable-next-line no-unassigned-vars
  let listRef: HTMLUListElement | undefined;

  // Update results when query changes
  createEffect(() => {
    const filtered = searchTools(tools, query());
    setResults(filtered);
    setSelectedIndex(0);
  });

  function openPalette() {
    setOpen(true);
    setQuery("");
  }

  function closePalette() {
    setOpen(false);
    setQuery("");
    setSelectedIndex(0);
  }

  function navigateTo(slug: string) {
    closePalette();
    window.location.href = getToolRoute(slug);
  }

  function handleKeyDown(e: KeyboardEvent) {
    if (!open()) return;

    const len = totalItems();

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((i) => Math.min(i + 1, len - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (showPreferences() && selectedIndex() === 0) {
        closePalette();
        document.dispatchEvent(new CustomEvent("open-settings"));
      } else {
        const toolIndex = selectedIndex() - (showPreferences() ? 1 : 0);
        const tool = results()[toolIndex];
        if (tool) navigateTo(tool.slug);
      }
    } else if (e.key === "Escape") {
      e.preventDefault();
      closePalette();
    } else if (e.key === "Tab") {
      // Basic focus trap: keep focus inside modal
      e.preventDefault();
      inputRef?.focus();
    }
  }

  function handleGlobalKeyDown(e: KeyboardEvent) {
    const isMac = navigator.platform.toUpperCase().includes("MAC");
    const modKey = isMac ? e.metaKey : e.ctrlKey;
    if (modKey && e.key === "k") {
      e.preventDefault();
      if (open()) {
        closePalette();
      } else {
        openPalette();
      }
    }
  }

  onMount(() => {
    document.addEventListener("keydown", handleGlobalKeyDown);
    document.addEventListener("keydown", handleKeyDown);
    onCleanup(() => {
      document.removeEventListener("keydown", handleGlobalKeyDown);
      document.removeEventListener("keydown", handleKeyDown);
    });
  });

  // Auto-focus input when palette opens
  createEffect(() => {
    if (open()) {
      // Defer to next tick so the element is in the DOM
      setTimeout(() => inputRef?.focus(), 0);
    }
  });

  // Scroll selected item into view
  createEffect(() => {
    const idx = selectedIndex();
    if (listRef) {
      const item = listRef.children[idx] as HTMLElement | undefined;
      item?.scrollIntoView({ block: "nearest" });
    }
  });

  return (
    <>
      {/* Trigger button */}
      <button
        onClick={openPalette}
        aria-label="Open command palette"
        class="inline-flex items-center gap-1.5 rounded border px-2.5 py-1 text-xs font-medium transition-opacity hover:opacity-80 focus:outline-none"
        style={{
          "background-color": "var(--bg-secondary)",
          "border-color": "var(--border)",
          color: "var(--text-muted)",
        }}
      >
        <Search size={12} />
        <span>Search</span>
        <span class="flex items-center gap-0.5">
          <kbd
            class="rounded px-1 py-0.5 text-[10px] font-mono"
            style={{
              "background-color": "var(--bg-primary)",
              "border-color": "var(--border)",
              color: "var(--text-muted)",
              border: "1px solid var(--border)",
            }}
          >
            ⌘
          </kbd>
          <kbd
            class="rounded px-1 py-0.5 text-[10px] font-mono"
            style={{
              "background-color": "var(--bg-primary)",
              "border-color": "var(--border)",
              color: "var(--text-muted)",
              border: "1px solid var(--border)",
            }}
          >
            K
          </kbd>
        </span>
      </button>

      {/* Overlay + Modal */}
      <Show when={open()}>
        {/* Backdrop */}
        <div
          class="fixed inset-0 z-50 flex items-start justify-center pt-[12vh]"
          style={{ "background-color": "rgba(0, 0, 0, 0.4)" }}
          onClick={(e) => {
            if (e.target === e.currentTarget) closePalette();
          }}
        >
          {/* Dialog */}
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Command palette"
            class="flex w-full max-w-[600px] flex-col overflow-hidden rounded-md shadow-2xl"
            style={{
              "background-color": "var(--bg-secondary)",
              border: "1px solid var(--border)",
              "max-height": "480px",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Search input row */}
            <div
              class="flex items-center gap-3 px-4 py-3"
              style={{ "border-bottom": "1px solid var(--border)" }}
            >
              <Search size={16} style={{ color: "var(--text-muted)" }} />
              <input
                ref={inputRef}
                type="text"
                placeholder="Search tools..."
                value={query()}
                onInput={(e) => setQuery(e.currentTarget.value)}
                class="flex-1 bg-transparent text-sm outline-none placeholder:text-[color:var(--text-muted)]"
                style={{ color: "var(--text-primary)", outline: "none" }}
                aria-label="Search tools"
                autocomplete="off"
                spellcheck={false}
              />
              <kbd
                class="hidden rounded px-1.5 py-0.5 text-[10px] font-mono sm:block"
                style={{
                  "background-color": "var(--bg-primary)",
                  border: "1px solid var(--border)",
                  color: "var(--text-muted)",
                }}
              >
                esc
              </kbd>
            </div>

            {/* Results list */}
            <ul
              ref={listRef}
              class="overflow-y-auto py-1"
              style={{ "max-height": "380px" }}
              role="listbox"
              aria-label="Tool results"
            >
              {/* Preferences command — always first */}
              <Show when={showPreferences()}>
                <li
                  role="option"
                  aria-selected={selectedIndex() === 0}
                  onClick={() => {
                    closePalette();
                    document.dispatchEvent(new CustomEvent("open-settings"));
                  }}
                  onMouseEnter={() => setSelectedIndex(0)}
                  class="flex cursor-pointer items-center gap-3 rounded-none px-3 py-2 transition-colors"
                  style={{
                    "background-color":
                      selectedIndex() === 0
                        ? "color-mix(in srgb, var(--accent-primary) 15%, transparent)"
                        : "transparent",
                    "border-left":
                      selectedIndex() === 0
                        ? "2px solid var(--accent-primary)"
                        : "2px solid transparent",
                    "border-bottom": "1px solid var(--border)",
                    "padding-left": selectedIndex() === 0 ? "calc(0.75rem - 2px)" : "0.75rem",
                  }}
                >
                  {/* Icon */}
                  <span
                    style={{
                      color:
                        selectedIndex() === 0 ? "var(--accent-primary)" : "var(--text-secondary)",
                      "flex-shrink": "0",
                      display: "flex",
                    }}
                  >
                    <Settings size={16} />
                  </span>

                  {/* Text */}
                  <div class="min-w-0 flex-1">
                    <div class="flex items-center gap-2">
                      <span class="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                        Preferences
                      </span>
                    </div>
                    <p class="mt-0.5 truncate text-[12px]" style={{ color: "var(--text-muted)" }}>
                      Color theme, keyboard shortcuts &amp; more
                    </p>
                  </div>

                  {/* Enter hint */}
                  <Show when={selectedIndex() === 0}>
                    <kbd
                      class="hidden shrink-0 rounded px-1.5 py-0.5 text-[10px] font-mono sm:block"
                      style={{
                        "background-color": "var(--bg-primary)",
                        border: "1px solid var(--border)",
                        color: "var(--text-muted)",
                      }}
                    >
                      ↵
                    </kbd>
                  </Show>
                </li>
              </Show>

              <Show
                when={results().length > 0}
                fallback={
                  <li class="px-4 py-8 text-center text-sm" style={{ color: "var(--text-muted)" }}>
                    No tools found for &ldquo;{query()}&rdquo;
                  </li>
                }
              >
                <For each={results()}>
                  {(tool, index) => {
                    const itemIndex = () => index() + (showPreferences() ? 1 : 0);
                    return (
                      <li
                        role="option"
                        aria-selected={selectedIndex() === itemIndex()}
                        onClick={() => navigateTo(tool.slug)}
                        onMouseEnter={() => setSelectedIndex(itemIndex())}
                        class="flex cursor-pointer items-center gap-3 rounded-none px-3 py-2 transition-colors"
                        style={{
                          "background-color":
                            selectedIndex() === itemIndex()
                              ? "color-mix(in srgb, var(--accent-primary) 15%, transparent)"
                              : "transparent",
                          "border-left":
                            selectedIndex() === itemIndex()
                              ? "2px solid var(--accent-primary)"
                              : "2px solid transparent",
                          "padding-left":
                            selectedIndex() === itemIndex() ? "calc(0.75rem - 2px)" : "0.75rem",
                        }}
                      >
                        {/* Icon */}
                        <span
                          style={{
                            color:
                              selectedIndex() === itemIndex()
                                ? "var(--accent-primary)"
                                : "var(--text-secondary)",
                            "flex-shrink": "0",
                            display: "flex",
                          }}
                        >
                          <ToolIcon name={tool.icon} size={16} />
                        </span>

                        {/* Text */}
                        <div class="min-w-0 flex-1">
                          <div class="flex items-center gap-2">
                            <span
                              class="text-sm font-semibold"
                              style={{ color: "var(--text-primary)" }}
                            >
                              {tool.name}
                            </span>
                            <span
                              class="text-[10px] font-medium uppercase tracking-wide"
                              style={{ color: "var(--text-muted)" }}
                            >
                              {tool.category}
                            </span>
                            <Show when={tool.isNew}>
                              <span
                                class="rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide"
                                style={{
                                  "background-color":
                                    "color-mix(in srgb, var(--accent-primary) 20%, transparent)",
                                  color: "var(--accent-primary)",
                                }}
                              >
                                New
                              </span>
                            </Show>
                          </div>
                          <p
                            class="mt-0.5 truncate text-[12px]"
                            style={{ color: "var(--text-muted)" }}
                          >
                            {tool.description}
                          </p>
                        </div>

                        {/* Enter hint */}
                        <Show when={selectedIndex() === itemIndex()}>
                          <kbd
                            class="hidden shrink-0 rounded px-1.5 py-0.5 text-[10px] font-mono sm:block"
                            style={{
                              "background-color": "var(--bg-primary)",
                              border: "1px solid var(--border)",
                              color: "var(--text-muted)",
                            }}
                          >
                            ↵
                          </kbd>
                        </Show>
                      </li>
                    );
                  }}
                </For>
              </Show>
            </ul>
          </div>
        </div>
      </Show>
    </>
  );
}
