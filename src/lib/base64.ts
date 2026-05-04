import { DEFAULT_IMPORT_MAX_BYTES, formatBytes, type ImportedFileMeta } from "./fileImport";

export type Base64Variant = "standard" | "url";
export type Base64Mode = "encode" | "decode";
export type Base64Workflow = "text" | "file";
export type Base64DecodeOutputKind = "text" | "bytes";

export interface Base64TextTransformSuccess {
  ok: true;
  value: string;
  outputKind: "text";
}

export interface Base64BinaryTransformSuccess {
  ok: true;
  value: string;
  outputKind: "bytes";
  bytes: Uint8Array;
  downloadName: string;
}

export type Base64TransformSuccess = Base64TextTransformSuccess | Base64BinaryTransformSuccess;

export interface Base64TransformFailure {
  ok: false;
  error: string;
}

export type Base64TransformResult = Base64TransformSuccess | Base64TransformFailure;

export function encodeTextToBase64(input: string, variant: Base64Variant): string {
  return encodeBytesToBase64(new TextEncoder().encode(input), variant);
}

export function encodeBytesToBase64(bytes: Uint8Array, variant: Base64Variant): string {
  let binary = "";

  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }

  const encoded = btoa(binary);

  return variant === "url" ? toBase64Url(encoded) : encoded;
}

export function decodeBase64ToBytes(input: string, variant: Base64Variant): Uint8Array {
  const normalized = normalizeBase64Input(input, variant);
  const binary = atob(normalized);
  const bytes = new Uint8Array(binary.length);

  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }

  return bytes;
}

export function decodeBase64ToText(input: string, variant: Base64Variant): string {
  return new TextDecoder("utf-8", { fatal: true }).decode(decodeBase64ToBytes(input, variant));
}

export function deriveDecodedFileName(sourceName?: string | null): string {
  const trimmed = sourceName?.trim();
  if (!trimmed) {
    return "decoded.bin";
  }

  const stripped = trimmed.replace(/(?:\.(?:base64|b64))(?:\.txt)?$/i, "");
  if (stripped !== trimmed) {
    return /\.[^.]+$/.test(stripped) ? stripped : `${stripped}.bin`;
  }

  return `${trimmed}.decoded.bin`;
}

export function processBase64Input(
  input: string,
  mode: Base64Mode,
  variant: Base64Variant,
  workflow: Base64Workflow,
  options: { sourceName?: string | null } = {}
): Base64TransformResult {
  if (!input.trim()) {
    return mode === "decode" && workflow === "file"
      ? {
          ok: true,
          value: "",
          outputKind: "bytes",
          bytes: new Uint8Array(),
          downloadName: deriveDecodedFileName(options.sourceName),
        }
      : {
          ok: true,
          value: "",
          outputKind: "text",
        };
  }

  try {
    if (mode === "encode") {
      return {
        ok: true,
        value: workflow === "text" ? encodeTextToBase64(input, variant) : input,
        outputKind: "text",
      };
    }

    if (workflow === "file") {
      const bytes = decodeBase64ToBytes(input, variant);
      return {
        ok: true,
        value: formatByteSummary(bytes),
        outputKind: "bytes",
        bytes,
        downloadName: deriveDecodedFileName(options.sourceName),
      };
    }

    return {
      ok: true,
      value: decodeBase64ToText(input, variant),
      outputKind: "text",
    };
  } catch {
    return {
      ok: false,
      error:
        mode === "decode"
          ? workflow === "file"
            ? "Invalid input for the selected Base64 variant. Binary decode could not be completed."
            : "Invalid input for the selected Base64 variant, or the decoded bytes are not valid UTF-8 text."
          : "Encoding failed for the current input.",
    };
  }
}

export function formatBase64FileNotice(
  file: ImportedFileMeta,
  mode: Base64Mode,
  workflow: Base64Workflow
): string {
  const operation = mode === "encode" ? "encode" : workflow === "file" ? "inspect" : "decode";
  return `${file.name} is ${formatBytes(file.size)}. Large files may take longer to ${operation}.`;
}

export function formatBase64FileTooLargeMessage(
  maxBytes: number = DEFAULT_IMPORT_MAX_BYTES
): string {
  return `File is too large. Maximum supported size is ${formatBytes(maxBytes)}.`;
}

export function toBase64Url(value: string): string {
  return value.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function normalizeBase64Input(input: string, variant: Base64Variant): string {
  const trimmed = input.trim();
  const sanitized = variant === "url" ? trimmed.replace(/-/g, "+").replace(/_/g, "/") : trimmed;

  if (sanitized.length === 0) {
    return sanitized;
  }

  const remainder = sanitized.length % 4;
  if (remainder === 1) {
    throw new Error("Invalid base64 length");
  }

  return remainder === 0 ? sanitized : sanitized + "=".repeat(4 - remainder);
}

function formatByteSummary(bytes: Uint8Array): string {
  const preview = Array.from(bytes.slice(0, 32))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join(" ");

  return bytes.length <= 32
    ? `${bytes.length} bytes\n${preview}`
    : `${bytes.length} bytes\n${preview}\n...`;
}
