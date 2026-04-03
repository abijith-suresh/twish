interface ToolErrorFallbackProps {
  toolName: string;
  onRetry?: () => void;
  error?: unknown;
}

export function getToolErrorMessage(error: unknown, isProd: boolean): string | null {
  if (isProd) {
    return null;
  }

  return error instanceof Error ? error.message : "Unknown tool error";
}

function getErrorMessage(error: unknown): string | null {
  return getToolErrorMessage(error, import.meta.env.PROD);
}

export default function ToolErrorFallback(props: ToolErrorFallbackProps) {
  return (
    <div
      role="alert"
      style={{
        display: "flex",
        "flex-direction": "column",
        gap: "0.75rem",
        padding: "1rem",
        border: "1px solid var(--accent-error)",
        "border-radius": "0.5rem",
        background: "color-mix(in srgb, var(--accent-error) 10%, transparent)",
        color: "var(--text-primary)",
      }}
    >
      <div style={{ display: "flex", "flex-direction": "column", gap: "0.25rem" }}>
        <strong style={{ color: "var(--accent-error)", "font-size": "0.9rem" }}>
          {props.toolName} could not be loaded
        </strong>
        <span style={{ color: "var(--text-secondary)", "font-size": "0.85rem" }}>
          The editor shell is still available. Retry the tool, or switch to another tool.
        </span>
        {getErrorMessage(props.error) ? (
          <code style={{ color: "var(--text-muted)", "font-size": "0.75rem" }}>
            {getErrorMessage(props.error)}
          </code>
        ) : null}
      </div>

      {props.onRetry ? (
        <button
          onClick={props.onRetry}
          style={{
            "align-self": "flex-start",
            padding: "0.35rem 0.7rem",
            "border-radius": "0.375rem",
            border: "1px solid var(--border)",
            background: "var(--bg-secondary)",
            color: "var(--text-secondary)",
            cursor: "pointer",
            "font-size": "0.8rem",
          }}
        >
          Retry tool
        </button>
      ) : null}
    </div>
  );
}
