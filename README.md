# unwrapped.tools

`unwrapped.tools` is a local-only suite of developer utilities that runs entirely in the browser.

No server. No uploads. No tracking.

## Why

Developers paste secrets — tokens, JWTs, config files — into online tools every day, usually with no guarantee about where the data goes. unwrapped.tools gives the guarantee structurally: there is no backend. Every tool executes client-side, nothing is uploaded, and almost nothing is stored.

## Privacy contract

- Tool inputs stay in the browser and are never persisted.
- The single registered localStorage key is `unwrapped-tool-session:diff`, which stores diff display preferences (language and changes-only mode) only.
- Clearing site data in your browser removes everything the app has stored.

See `/privacy` in the app for the current local persistence contract.

## Tools

The shipped set covers secrets and security (JWT inspection, hashes, HMAC, tokens, UUIDs, chmod), config and data (diff with structured compare, JSON/YAML/TOML/CSV/XML format and convert), text (regex testing, case conversion, text statistics), and reference (HTTP status codes, timestamps, cron schedules).

`src/tools/registry.ts` is the source of truth for the current list; every tool is served from `/tools/[slug]` and runs inside the same shell with a failure boundary.

## Stack

- Astro 7
- SolidJS
- Tailwind CSS v4
- TypeScript strict mode
- Bun
- Vercel

## Development

```sh
bun install
bun run dev
bun run build
bun run preview
bun run type-check
bun run lint
bun run format
bun run test
bun run verify
```

See `AGENTS.md` for the product truth, hard rules, and contribution workflow.
