import { createSignal, ErrorBoundary, onMount, Show } from "solid-js";
import type { Component } from "solid-js";
import { Dynamic, isServer } from "solid-js/web";

import ToolErrorFallback from "@/components/ToolErrorFallback";

interface ToolHostProps {
  componentPath: string;
  toolName: string;
}

const toolModules = import.meta.glob<{ default: Component }>("../tools/*/*.tsx");

export default function ToolHost(props: ToolHostProps) {
  const [toolComponent, setToolComponent] = createSignal<Component | null>(null);
  const [loadError, setLoadError] = createSignal<unknown>(null);

  async function loadToolComponent() {
    setLoadError(null);

    try {
      const modulePath = `../${props.componentPath.slice(5)}`;
      const loadTool = toolModules[modulePath];

      if (!loadTool) {
        throw new Error(`Missing tool component loader for ${props.componentPath}`);
      }

      const module = await loadTool();
      setToolComponent(() => module.default);
    } catch (error) {
      setToolComponent(null);
      setLoadError(error);
      console.error(error);
    }
  }

  onMount(async () => {
    await loadToolComponent();
  });

  if (isServer) {
    return null;
  }

  return (
    <Show
      when={toolComponent()}
      fallback={
        loadError() ? (
          <ToolErrorFallback
            toolName={props.toolName}
            error={loadError()}
            onRetry={() => void loadToolComponent()}
          />
        ) : null
      }
    >
      {(Component) => (
        <ErrorBoundary
          fallback={(error, reset) => (
            <ToolErrorFallback toolName={props.toolName} error={error} onRetry={reset} />
          )}
        >
          <Dynamic component={Component()} />
        </ErrorBoundary>
      )}
    </Show>
  );
}
