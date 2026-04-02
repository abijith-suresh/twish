import type { Component } from "solid-js";
import { createSignal, onMount, Show } from "solid-js";
import { Dynamic, isServer } from "solid-js/web";

interface ToolHostProps {
  componentPath: string;
}

const toolModules = import.meta.glob<{ default: Component }>("../tools/*/*.tsx");

export default function ToolHost(props: ToolHostProps) {
  const [toolComponent, setToolComponent] = createSignal<Component | null>(null);

  onMount(async () => {
    try {
      const modulePath = `../${props.componentPath.slice(5)}`;
      const loadTool = toolModules[modulePath];

      if (!loadTool) {
        throw new Error(`Missing tool component loader for ${props.componentPath}`);
      }

      const module = await loadTool();
      setToolComponent(() => module.default);
    } catch (error) {
      console.error(error);
    }
  });

  if (isServer) {
    return null;
  }

  return <Show when={toolComponent()}>{(Component) => <Dynamic component={Component()} />}</Show>;
}
