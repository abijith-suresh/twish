export type HashAlgorithm = "SHA-1" | "SHA-256" | "SHA-384" | "SHA-512";

export interface HashResult {
  algorithm: HashAlgorithm;
  hex: string;
}

export const HASH_ALGORITHMS: HashAlgorithm[] = ["SHA-1", "SHA-256", "SHA-384", "SHA-512"];

export async function hashBytes(bytes: Uint8Array, algorithm: HashAlgorithm): Promise<string> {
  const buffer = await crypto.subtle.digest(algorithm, bytes as unknown as BufferSource);

  return Array.from(new Uint8Array(buffer))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

export async function hashText(text: string, algorithm: HashAlgorithm): Promise<string> {
  const encoder = new TextEncoder();
  return hashBytes(encoder.encode(text), algorithm);
}

export async function hashBytesWithAlgorithms(bytes: Uint8Array): Promise<HashResult[]> {
  return Promise.all(
    HASH_ALGORITHMS.map(async (algorithm) => ({
      algorithm,
      hex: await hashBytes(bytes, algorithm),
    }))
  );
}

export async function hashTextWithAlgorithms(text: string): Promise<HashResult[]> {
  const encoder = new TextEncoder();
  return hashBytesWithAlgorithms(encoder.encode(text));
}
