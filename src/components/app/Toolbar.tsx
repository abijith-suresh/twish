interface Props {
  onCompare: () => void;
  onSwap: () => void;
  onClear: () => void;
}

export default function Toolbar(props: Props) {
  return (
    <div class="toolbar">
      <button type="button" onClick={props.onCompare} class="btn-compare">
        Compare
        <kbd class="kbd">Ctrl+↵</kbd>
      </button>

      <button type="button" onClick={props.onSwap} class="btn-secondary" title="Swap panels">
        Swap ⇄
      </button>

      <button type="button" onClick={props.onClear} class="btn-secondary" title="Clear both panels">
        Clear
      </button>
    </div>
  );
}
