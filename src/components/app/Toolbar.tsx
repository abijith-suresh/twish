import React from "react";

interface Props {
  onCompare: () => void;
  onSwap: () => void;
  onClear: () => void;
}

export default function Toolbar({ onCompare, onSwap, onClear }: Props) {
  return (
    <div className="flex shrink-0 items-center gap-2 border-b border-slate-800 bg-slate-950 px-4 py-2">
      <button
        type="button"
        onClick={onCompare}
        className="flex items-center gap-1.5 rounded bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-indigo-500"
      >
        Compare
        <kbd className="rounded bg-indigo-800 px-1 py-0.5 text-[10px] font-normal opacity-75">
          Ctrl+↵
        </kbd>
      </button>

      <button
        type="button"
        onClick={onSwap}
        className="rounded border border-slate-700 px-3 py-1.5 text-xs font-medium text-slate-300 transition-colors hover:bg-slate-800"
        title="Swap panels"
      >
        Swap ⇄
      </button>

      <button
        type="button"
        onClick={onClear}
        className="rounded border border-slate-700 px-3 py-1.5 text-xs font-medium text-slate-400 transition-colors hover:bg-slate-800 hover:text-slate-300"
        title="Clear both panels"
      >
        Clear
      </button>
    </div>
  );
}
