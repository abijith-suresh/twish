# unwrapped.tools

`unwrapped.tools` is a desktop-first, local-first PWA for developer utilities that run entirely in the browser.

No server. No uploads. No tracking.

## Product contract

- Every shipped tool is registered in `src/tools/registry.ts` and served from `/tools/[slug]`.
- Every tool runs inside the same editor-style shell and is loaded on the client.
- Shared platform code owns persistence, file import policy, clipboard helpers, route recovery, and tool failure boundaries.
- Tool inputs do not persist by default. Local persistence is limited to documented shell and preference state.

See `/privacy` in the app for the current local persistence contract and clear-data path.

## Browser and runtime support

- JavaScript is required for tool execution.
- Modern browser APIs are required for the full experience: Web Crypto, `Intl.DateTimeFormat`, `navigator.clipboard`, file APIs, and Web Workers.
- The PWA is installable and caches the app shell after the first successful load.
- Offline navigation is conservative: the app falls back to `/`, and installed sessions can restore the last visited tool route from local storage.

## Tool reference

| Tool                | Example use                                          | Inputs and outputs                                                                                                                              | Runtime notes                                                                                           | Known limitations                                                                                                                                                                      |
| ------------------- | ---------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| JWT Decoder         | Inspect a bearer token payload before debugging auth | Input: a 3-part JWT string. Output: decoded header, payload, signature segment, expiry state, copy actions.                                     | Uses `atob` and browser date APIs.                                                                      | Decode only. No signature verification or claim validation beyond basic expiry display.                                                                                                |
| Text Diff           | Compare two config files before rollout              | Input: pasted text or one imported file per side. Output: side-by-side diff, change counts, navigation, swap, structured compare when possible. | Uses file APIs, drag and drop, local storage for diff preferences, and a worker path for heavier diffs. | File import is capped at 2 MB and warns above 512 KB. Structured normalization only applies when both sides are the same supported structured type. Compared content does not persist. |
| Base64              | Encode a short token or decode a text payload        | Input: text or an imported file. Output: encoded or decoded text, copy, swap, file warnings.                                                    | Uses `btoa`, `atob`, `TextDecoder`, and file APIs.                                                      | Optimized for text workflows. Decoding assumes UTF-8 text output, and current file workflows should not be treated as arbitrary binary export support.                                 |
| JSON Formatter      | Validate and pretty-print API payloads               | Input: JSON text. Output: formatted JSON, minified JSON, validation errors, syntax-highlighted preview, copy actions.                           | Uses built-in JSON parsing and formatting.                                                              | Strict JSON only. No JSON5, comments, or file import.                                                                                                                                  |
| Hash Generator      | Generate a checksum for pasted content               | Input: text. Output: SHA-1, SHA-256, SHA-384, and SHA-512 hex digests.                                                                          | Uses `crypto.subtle.digest`.                                                                            | Text only. No file hashing, keyed hashing, or alternate encodings.                                                                                                                     |
| UUID Generator      | Create a batch of IDs for fixtures or test data      | Input: count from 1 to 100 and optional uppercase mode. Output: UUID v4 list, copy one, copy all, reset.                                        | Uses `crypto.randomUUID` and clipboard APIs.                                                            | UUID v4 only. Count is capped at 100.                                                                                                                                                  |
| Timestamp Converter | Convert an epoch value into human-readable dates     | Input: Unix timestamp text or `datetime-local`. Output: epoch seconds, epoch milliseconds, ISO timestamp, and timezone-specific renderings.     | Uses `Date` and `Intl.DateTimeFormat`.                                                                  | Seconds vs milliseconds is inferred by magnitude. Timezone choices are limited to the shipped presets.                                                                                 |
| Regex Tester        | Validate a pattern against sample text               | Input: pattern, test string, and `g`, `i`, `m`, `s` flags. Output: live match highlighting, counts, capture groups, copy actions.               | Uses the browser JavaScript `RegExp` engine.                                                            | Only `g`, `i`, `m`, and `s` are exposed. No replace mode, Unicode flag controls, or file input yet.                                                                                    |

## Local-only baseline

- Tool content stays in the browser.
- The app does not send tool inputs to a backend service.
- Registered local persistence is limited to theme selection, installed-session route recovery, and diff view preferences.
- Settings exposes `Clear local data`, which clears those registered values and resets the shell theme.

## Stack

- Astro 5
- SolidJS
- Tailwind CSS v4
- TypeScript strict mode
- Bun
- Vercel

## Development

```sh
bun install
bun dev
bun build
bun preview
bun run type-check
bun run lint
bun run format
bun run test
```

See `AGENTS.md` for contributor instructions, the engineering baseline, and architecture notes.
