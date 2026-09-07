# Agent Instructions — unwrapped.tools

## Product Summary

unwrapped.tools is a local-only suite of developer utilities that runs entirely in the browser.

It exists because developers routinely paste secrets (JWTs, tokens, config files) into online tools that give no guarantee about where the data goes. unwrapped.tools gives that guarantee structurally: there is no backend. Every tool executes client-side, nothing is uploaded, and persistence is minimal and documented.

## Product Truth

This section is the product source of truth. Update it before changing product scope, promises, or non-goals. Code and public copy follow this section, not the other way around.

### Core Promise

- Every tool runs entirely client-side, in the browser.
- Tool inputs never leave the device: no uploads, no server processing, no beacons.
- No accounts, signups, or login.
- No ads, tracking, analytics, or telemetry.
- Tool inputs are not persisted. Local persistence is limited to documented, registered preference keys.
- Keep the product honest about what is implemented today.

### Current Product Surface

The active product is a set of focused, single-purpose developer tools served from `/tools/[slug]`:

- secrets and security: JWT inspection, hashes, HMAC, tokens, UUIDs, chmod
- config and data: diff with structured compare, JSON/YAML/TOML/CSV/XML format and convert
- text: regex testing, case conversion, text statistics
- reference and time: HTTP status codes, timestamp conversion, cron schedules

`src/tools/registry.ts` is the single source of truth for the tool list. Do not duplicate tool metadata in docs, marketing pages, or scripts.

### Non-Goals

The product does not include, and must not gain without this section changing first:

- backend processing, uploads, or any server round-trip for tool input
- accounts, signups, sync, or collaboration
- ads, tracking, analytics, or fingerprinting
- persisting tool inputs or outputs by default
- speculative code kept only for possible future expansion
- public promises for features that are not implemented

## Hard Rules

These rules are enforceable invariants. Violating any of them is a defect even if tests pass.

### Privacy

- Keep all tool execution client-side. Do not add server processing, uploads, analytics, or telemetry.
- Do not persist tool inputs by default. If persistence is required, document it and register the key in `src/lib/localPersistence.ts`.
- Keep privacy, settings, and storage behavior aligned across the app and public copy.

### Correctness

- `src/tools/registry.ts` is the single source of truth for tool metadata and routing. Do not duplicate tool metadata elsewhere.
- Use `src/lib/fileImport.ts` for user file reads so limits and error handling stay consistent.
- Prefer explicit result unions (`{ ok: true } | { ok: false, error }`) over thrown errors for parse-capable library code.
- Business logic lives in `src/lib/` or tool-local modules, never inline in components. Components gather input, show state, and render results.

### Consistency

- Use the `@/` path alias for `src` imports.
- Follow existing design tokens in `src/styles/` before introducing one-off values.
- Treat stale docs as defects. If product scope changes, update the Product Truth section of this file first, then code, then public copy.

## Documentation

- `README.md`: user-facing current behavior only.
- `AGENTS.md`: agent behavior, product truth, and hard rules.

Do not advertise unimplemented features in either file.

## Commands

- Install dependencies: `bun install`
- Dev server: `bun run dev`
- Quality gate: `bun run verify`
- Individual steps: `bun run type-check`, `bun run lint`, `bun run format:check`, `bun run test`, `bun run build`

## Git And CI

- Branch from the latest `main` before starting changes.
- Never commit directly to `main`.
- Commit and PR titles must use Conventional Commits: `feat`, `fix`, `docs`, `refactor`, `chore`, `test`, `ci`, or `build`.
- Before push, run `bun run verify`.
- `pre-commit` runs `lint-staged`, `commit-msg` runs `commitlint`, and `pre-push` runs `bun run verify`.
- CI enforces `quality` and PR-title checks on pull requests.
- Squash merge is the expected merge strategy.
- Open one focused PR at a time, then stop and wait for review or merge feedback before continuing.
