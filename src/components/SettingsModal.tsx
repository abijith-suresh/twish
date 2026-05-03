import { Check, Settings, X } from "lucide-solid";
import { createEffect, createSignal, For, onCleanup, onMount, Show } from "solid-js";

import { clearLocalPersistence } from "@/lib/localPersistence";
import { applyTheme, DEFAULT_THEME, getTheme, setTheme, type ThemeName, THEMES } from "@/lib/theme";

// Hardcoded accent hex values for theme dot previews (explicitly allowed)
const THEME_ACCENTS: Record<ThemeName, string> = {
  dracula: "#bd93f9",
  catppuccin: "#cba6f7",
  nord: "#88c0d0",
  gruvbox: "#d3869b",
};

export default function SettingsModal() {
  const [open, setOpen] = createSignal(false);
  const [activeTheme, setActiveTheme] = createSignal<ThemeName>(getTheme());
  const [hoveredTheme, setHoveredTheme] = createSignal<ThemeName | null>(null);

  let dialogRef: HTMLDivElement | undefined;
  let prevFocus: HTMLElement | null = null;

  function openModal() {
    prevFocus = document.activeElement as HTMLElement;
    setActiveTheme(getTheme());
    setOpen(true);
  }

  function closeModal() {
    setOpen(false);
    setTimeout(() => prevFocus?.focus(), 0);
  }

  function handleClear() {
    clearLocalPersistence();
    applyTheme(DEFAULT_THEME);
    closeModal();
  }

  // Auto-focus first focusable element when modal opens
  createEffect(() => {
    if (!open()) return;
    setTimeout(() => {
      const focusable = dialogRef?.querySelectorAll<HTMLElement>(
        'button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );
      focusable?.[0]?.focus();
    }, 0);
  });

  function handleKeyDown(e: KeyboardEvent) {
    if (!open()) return;
    if (e.key === "Escape") {
      e.preventDefault();
      closeModal();
      return;
    }
    if (e.key === "Tab" && dialogRef) {
      const focusable = Array.from(
        dialogRef.querySelectorAll<HTMLElement>(
          'button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])'
        )
      );
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }
  }

  onMount(() => {
    const openHandler = () => openModal();
    document.addEventListener("open-settings", openHandler);
    document.addEventListener("keydown", handleKeyDown);
    onCleanup(() => {
      document.removeEventListener("open-settings", openHandler);
      document.removeEventListener("keydown", handleKeyDown);
    });
  });

  return (
    <>
      {/* Gear button trigger */}
      <button
        onClick={openModal}
        aria-label="Open settings"
        class="flex items-center justify-center transition-opacity focus:outline-none"
        style={{ color: "var(--bg-primary)", opacity: "0.7" }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLButtonElement).style.opacity = "1";
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLButtonElement).style.opacity = "0.7";
        }}
      >
        <Settings size={13} />
      </button>

      <Show when={open()}>
        {/* Backdrop */}
        <div
          class="fixed inset-0 z-50 flex items-start justify-center pt-[12vh]"
          style={{ "background-color": "rgba(0, 0, 0, 0.4)" }}
          onClick={(e) => {
            if (e.target === e.currentTarget) closeModal();
          }}
        >
          {/* Dialog */}
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Settings"
            ref={(el) => (dialogRef = el)}
            class="w-full max-w-[400px] overflow-hidden rounded-md shadow-2xl"
            style={{
              "background-color": "var(--bg-secondary)",
              border: "1px solid var(--border)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div
              class="flex items-center justify-between px-4 py-3"
              style={{ "border-bottom": "1px solid var(--border)" }}
            >
              <span class="text-base font-semibold" style={{ color: "var(--text-primary)" }}>
                Settings
              </span>
              <button
                onClick={closeModal}
                aria-label="Close settings"
                class="flex items-center justify-center rounded transition-colors focus:outline-none"
                style={{ color: "var(--text-muted)", padding: "2px" }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.color = "var(--text-primary)";
                  (e.currentTarget as HTMLButtonElement).style.backgroundColor =
                    "var(--bg-tertiary)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.color = "var(--text-muted)";
                  (e.currentTarget as HTMLButtonElement).style.backgroundColor = "transparent";
                }}
              >
                <X size={14} />
              </button>
            </div>

            {/* COLOR THEME section */}
            <div>
              {/* Section label */}
              <div class="px-3 py-1.5" style={{ "background-color": "var(--bg-tertiary)" }}>
                <span
                  class="text-[10px] font-semibold uppercase tracking-widest"
                  style={{ color: "var(--text-muted)" }}
                >
                  COLOR THEME
                </span>
              </div>

              {/* Theme rows */}
              <ul role="listbox" aria-label="Color theme">
                <For each={THEMES}>
                  {(theme) => {
                    const isActive = () => activeTheme() === theme.name;
                    const isHovered = () => hoveredTheme() === theme.name;
                    return (
                      <li
                        role="option"
                        aria-selected={isActive()}
                        onClick={() => {
                          setTheme(theme.name);
                          setActiveTheme(theme.name);
                        }}
                        onMouseEnter={() => setHoveredTheme(theme.name)}
                        onMouseLeave={() => setHoveredTheme(null)}
                        class="flex cursor-pointer items-center gap-3 px-3 py-2 transition-colors"
                        style={{
                          "background-color":
                            isActive() || isHovered()
                              ? "color-mix(in srgb, var(--accent-primary) 15%, transparent)"
                              : "transparent",
                        }}
                      >
                        {/* Color dot */}
                        <span
                          style={{
                            display: "inline-block",
                            width: "12px",
                            height: "12px",
                            "border-radius": "50%",
                            "background-color": THEME_ACCENTS[theme.name],
                            "flex-shrink": "0",
                          }}
                        />
                        {/* Theme name */}
                        <span
                          class="flex-1 text-sm font-semibold"
                          style={{ color: "var(--text-primary)" }}
                        >
                          {theme.label}
                        </span>
                        {/* Active checkmark */}
                        <Show when={isActive()}>
                          <Check size={13} style={{ color: "var(--accent-primary)" }} />
                        </Show>
                      </li>
                    );
                  }}
                </For>
              </ul>
            </div>

            {/* Footer — clear data */}
            <div class="px-3 py-2.5" style={{ "border-top": "1px solid var(--border)" }}>
              <button
                onClick={handleClear}
                class="w-full rounded px-3 py-1.5 text-left text-xs font-medium transition-colors focus:outline-none"
                style={{
                  "font-family": "var(--font-mono)",
                  background: "none",
                  border: "1px solid var(--border)",
                  color: "var(--text-muted)",
                  cursor: "pointer",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--accent-error)";
                  (e.currentTarget as HTMLButtonElement).style.color = "var(--accent-error)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--border)";
                  (e.currentTarget as HTMLButtonElement).style.color = "var(--text-muted)";
                }}
              >
                Clear local data
              </button>
            </div>
          </div>
        </div>
      </Show>
    </>
  );
}
