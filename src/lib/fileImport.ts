export const DEFAULT_IMPORT_WARN_BYTES = 512 * 1024;
export const DEFAULT_IMPORT_MAX_BYTES = 2 * 1024 * 1024;

export type FileImportReadMode = "text" | "bytes";

export interface ImportedFileMeta {
  name: string;
  size: number;
  type: string;
}

export interface FileImportPolicy {
  warnBytes?: number;
  maxBytes?: number;
}

export type FileImportError =
  | {
      code: "file-too-large";
      file: ImportedFileMeta;
      maxBytes: number;
    }
  | {
      code: "read-failed";
      file: ImportedFileMeta;
      message: string;
    };

export type FileImportDecision =
  | {
      status: "accept";
    }
  | {
      status: "warn";
      warnBytes: number;
    }
  | {
      status: "reject";
      maxBytes: number;
    };

export type FileImportResult<T> =
  | {
      ok: true;
      file: ImportedFileMeta;
      value: T;
      decision: FileImportDecision;
    }
  | {
      ok: false;
      error: FileImportError;
    };

function getFileMeta(file: File): ImportedFileMeta {
  return {
    name: file.name,
    size: file.size,
    type: file.type,
  };
}

export function evaluateFileImportPolicy(
  file: Pick<File, "size">,
  policy: FileImportPolicy = {}
): FileImportDecision {
  const warnBytes = policy.warnBytes ?? DEFAULT_IMPORT_WARN_BYTES;
  const maxBytes = policy.maxBytes ?? DEFAULT_IMPORT_MAX_BYTES;

  if (file.size > maxBytes) {
    return {
      status: "reject",
      maxBytes,
    };
  }

  if (file.size > warnBytes) {
    return {
      status: "warn",
      warnBytes,
    };
  }

  return {
    status: "accept",
  };
}

export async function readImportedFile(
  file: File,
  options: { as: "text"; policy?: FileImportPolicy }
): Promise<FileImportResult<string>>;
export async function readImportedFile(
  file: File,
  options: { as: "bytes"; policy?: FileImportPolicy }
): Promise<FileImportResult<Uint8Array>>;
export async function readImportedFile(
  file: File,
  options: { as: FileImportReadMode; policy?: FileImportPolicy }
): Promise<FileImportResult<string | Uint8Array>> {
  const fileMeta = getFileMeta(file);
  const decision = evaluateFileImportPolicy(file, options.policy);

  if (decision.status === "reject") {
    return {
      ok: false,
      error: {
        code: "file-too-large",
        file: fileMeta,
        maxBytes: decision.maxBytes,
      },
    };
  }

  try {
    const value =
      options.as === "text" ? await file.text() : new Uint8Array(await file.arrayBuffer());

    return {
      ok: true,
      file: fileMeta,
      value,
      decision,
    };
  } catch (error) {
    return {
      ok: false,
      error: {
        code: "read-failed",
        file: fileMeta,
        message: error instanceof Error ? error.message : "Failed to read file",
      },
    };
  }
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  }

  const kilobytes = bytes / 1024;
  if (kilobytes < 1024) {
    return `${Math.round(kilobytes)} KB`;
  }

  const megabytes = kilobytes / 1024;
  return `${megabytes.toFixed(megabytes >= 10 ? 0 : 1)} MB`;
}
