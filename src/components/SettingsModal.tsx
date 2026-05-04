import { Settings, X } from "lucide-solid";
import { createEffect, createSignal, onCleanup, onMount, Show } from "solid-js";

import { clearLocalPersistence } from "@/lib/localPersistence";

interface Props {
  /** When true, the gear button trigger is not rendered.
   *  The modal can still be opened via the `open-settings` DOM event. */
  hideButton?: boolean;
}

export default function SettingsModal(props: Props) {
  const [open, setOpen] = createSignal(false);

  let dialogRef: HTMLDivElement | undefined;
  let prevFocus: HTMLElement | null = null;

  function openModal() {
    prevFocus = document.activeElement as HTMLElement;
    setOpen(true);
  }

  function closeModal() {
    setOpen(false);
    setTimeout(() => prevFocus?.focus(), 0);
  }

  function handleClear() {
    clearLocalPersistence();
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
      {/* Gear button trigger — hidden when `hideButton` is true (e.g. landing page) */}
      <Show when={!props.hideButton}>
        <button
          onClick={openModal}
          aria-label="Open settings"
          class="flex items-center justify-center transition-opacity focus:outline-none"
          style={{ color: "var(--text-primary)", opacity: "0.5" }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.opacity = "0.85";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.opacity = "0.5";
          }}
        >
          <Settings size={13} />
        </button>
      </Show>

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

            {/* Footer — clear data */}
            <div class="px-3 py-3">
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
