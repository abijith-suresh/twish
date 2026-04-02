import { type Language, SUPPORTED_LANGUAGES } from "../../lib/language";

export const DIFF_SESSION_STORAGE_KEY = "unwrapped-tool-session:diff";
export const DIFF_SESSION_VERSION = 1;
export const DIFF_SESSION_MAX_CHARS = 100_000;

export interface DiffFileMeta {
  name: string;
  size: number;
  type: string;
}

export interface DiffSessionState {
  leftContent: string;
  rightContent: string;
  leftLang: Language;
  rightLang: Language;
  changesOnly: boolean;
  leftFile: DiffFileMeta | null;
  rightFile: DiffFileMeta | null;
}

function isLanguage(value: unknown): value is Language {
  return typeof value === "string" && SUPPORTED_LANGUAGES.includes(value as Language);
}

function isDiffFileMeta(value: unknown): value is DiffFileMeta {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const meta = value as Record<string, unknown>;

  return (
    typeof meta.name === "string" && typeof meta.size === "number" && typeof meta.type === "string"
  );
}

export function isDiffSessionState(value: unknown): value is DiffSessionState {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const state = value as Record<string, unknown>;

  return (
    typeof state.leftContent === "string" &&
    typeof state.rightContent === "string" &&
    isLanguage(state.leftLang) &&
    isLanguage(state.rightLang) &&
    typeof state.changesOnly === "boolean" &&
    (state.leftFile === null || isDiffFileMeta(state.leftFile)) &&
    (state.rightFile === null || isDiffFileMeta(state.rightFile))
  );
}

export function shouldPersistDiffSession(
  state: Pick<DiffSessionState, "leftContent" | "rightContent">
): boolean {
  return state.leftContent.length + state.rightContent.length <= DIFF_SESSION_MAX_CHARS;
}
