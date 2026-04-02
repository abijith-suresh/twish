export interface PersistedSessionEnvelope<T> {
  version: number;
  data: T;
}

export interface SessionOptions<T> {
  key: string;
  version: number;
  isData: (value: unknown) => value is T;
  migrate?: (value: unknown, fromVersion: number) => T | null;
  storage?: Pick<Storage, "getItem" | "setItem" | "removeItem"> | null;
}

export function getBrowserStorage(): Storage | null {
  return typeof localStorage === "undefined" ? null : localStorage;
}

export function loadSessionState<T>(options: SessionOptions<T>): T | null {
  const storage = options.storage ?? getBrowserStorage();
  if (!storage) return null;

  try {
    const raw = storage.getItem(options.key);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as Partial<PersistedSessionEnvelope<unknown>>;
    if (typeof parsed !== "object" || parsed === null || typeof parsed.version !== "number") {
      return null;
    }

    if (parsed.version === options.version) {
      return options.isData(parsed.data) ? parsed.data : null;
    }

    if (!options.migrate) {
      return null;
    }

    return options.migrate(parsed.data, parsed.version);
  } catch {
    return null;
  }
}

export function saveSessionState<T>(
  options: Pick<SessionOptions<T>, "key" | "version" | "storage"> & { data: T }
): void {
  const storage = options.storage ?? getBrowserStorage();
  if (!storage) return;

  try {
    const payload: PersistedSessionEnvelope<T> = {
      version: options.version,
      data: options.data,
    };
    storage.setItem(options.key, JSON.stringify(payload));
  } catch {
    // Ignore quota and storage access failures.
  }
}

export function clearSessionState(
  key: string,
  storage: Pick<Storage, "removeItem"> | null = getBrowserStorage()
): void {
  if (!storage) return;

  try {
    storage.removeItem(key);
  } catch {
    // Ignore storage access failures.
  }
}
