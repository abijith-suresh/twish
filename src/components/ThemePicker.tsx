import { createSignal, For, onMount } from "solid-js";

import { getTheme, setTheme, type ThemeName, THEMES } from "@/lib/theme";

const THEME_COLORS: Record<ThemeName, string> = {
  dracula: "#bd93f9",
  catppuccin: "#cba6f7",
  nord: "#88c0d0",
  gruvbox: "#d3869b",
};

export default function ThemePicker() {
  const [activeTheme, setActiveTheme] = createSignal<ThemeName>("catppuccin");

  onMount(() => {
    setActiveTheme(getTheme());
  });

  function handleSelect(theme: ThemeName) {
    setTheme(theme);
    setActiveTheme(theme);
  }

  return (
    <div class="flex items-center gap-2" role="group" aria-label="Theme selector">
      <For each={THEMES}>
        {(theme) => (
          <button
            title={theme.label}
            aria-label={`Switch to ${theme.label} theme`}
            aria-pressed={activeTheme() === theme.name}
            onClick={() => handleSelect(theme.name)}
            class="h-5 w-5 rounded-full transition-all focus:outline-none focus-visible:ring-2"
            style={{
              "background-color": THEME_COLORS[theme.name],
              "box-shadow":
                activeTheme() === theme.name
                  ? `0 0 0 2px var(--bg-primary), 0 0 0 3.5px ${THEME_COLORS[theme.name]}`
                  : "none",
            }}
          />
        )}
      </For>
    </div>
  );
}
