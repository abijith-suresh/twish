import { Settings, X } from "lucide-solid";
import { createSignal, For, onCleanup, onMount, Show } from "solid-js";

import { getTheme, setTheme, type ThemeName, THEMES } from "@/lib/theme";

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

  function openModal() {
    setActiveTheme(getTheme());
    setOpen(true);
  }

  function closeModal() {
    setOpen(false);
  }

  function handleKeyDown(e: KeyboardEvent) {
    if (!open()) return;
    if (e.key === "Escape") {
      e.preventDefault();
      closeModal();
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
              <span class="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                Settings
              </span>
              <button
                onClick={closeModal}
                aria-label="Close settings"
                class="flex items-center justify-center focus:outline-none"
                style={{ color: "var(--text-muted)" }}
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
              <ul>
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
                          <span class="text-sm" style={{ color: "var(--accent-primary)" }}>
                            ✓
                          </span>
                        </Show>
                      </li>
                    );
                  }}
                </For>
              </ul>
            </div>
          </div>
        </div>
      </Show>
    </>
  );
}
