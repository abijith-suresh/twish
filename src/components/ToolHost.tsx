import type { Component } from "solid-js";
import { createResource, ErrorBoundary, Show } from "solid-js";
import { Dynamic, isServer } from "solid-js/web";

import ToolErrorFallback from "@/components/ToolErrorFallback";

interface ToolHostProps {
  componentPath: string;
  toolName: string;
  loadModule?: (componentPath: string) => Promise<Component>;
}

const toolModules = import.meta.glob<{ default: Component }>("../tools/*/*.tsx");

function loadToolModule(componentPath: string): Promise<Component> {
  const modulePath = `../${componentPath.slice(5)}`;
  const loadTool = toolModules[modulePath];
  if (!loadTool) {
    return Promise.reject(new Error(`Missing tool component loader for ${componentPath}`));
  }
  return loadTool().then((module) => module.default);
}

function ToolSkeleton() {
  return (
    <div class="flex flex-col gap-5 p-6 mx-auto w-full max-w-[860px] animate-pulse">
      <div class="flex gap-3 items-center">
        <div class="h-8 w-32 bg-[var(--bg-tertiary)] rounded" />
        <div class="h-8 w-24 bg-[var(--bg-tertiary)] rounded" />
      </div>
      <div class="h-40 w-full bg-[var(--bg-tertiary)] rounded-lg" />
      <div class="h-8 w-48 bg-[var(--bg-tertiary)] rounded" />
      <div class="h-32 w-full bg-[var(--bg-tertiary)] rounded-lg" />
      <div class="flex gap-3 items-center">
        <div class="h-8 w-20 bg-[var(--bg-tertiary)] rounded" />
        <div class="h-8 w-20 bg-[var(--bg-tertiary)] rounded" />
        <div class="h-8 w-28 bg-[var(--bg-tertiary)] rounded" />
      </div>
    </div>
  );
}

export default function ToolHost(props: ToolHostProps) {
  if (isServer) {
    return <ToolSkeleton />;
  }

  const [toolComponent, { refetch }] = createResource(
    () => props.componentPath,
    (path) => (props.loadModule ?? loadToolModule)(path)
  );

  return (
    <ErrorBoundary
      fallback={(error, reset) => (
        <ToolErrorFallback
          toolName={props.toolName}
          error={error}
          onRetry={() => {
            refetch();
            reset();
          }}
        />
      )}
    >
      <Show
        when={!toolComponent.error}
        fallback={
          <ToolErrorFallback
            toolName={props.toolName}
            error={toolComponent.error}
            onRetry={() => refetch()}
          />
        }
      >
        <Show when={toolComponent()} fallback={<ToolSkeleton />}>
          {(Component) => <Dynamic component={Component()} />}
        </Show>
      </Show>
    </ErrorBoundary>
  );
}
