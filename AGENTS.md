# Agent & Contributor Instructions

This is the canonical instruction file for AI agents and contributors. `CLAUDE.md` is a symlink to this file.

---

## Project Overview

**unwrapped.tools** is a desktop-first, local-first PWA — a collection of fast developer tools. No server, no uploads, no tracking.

Stack: Astro 5 · SolidJS · Tailwind CSS v4 · TypeScript strict · Bun

Deployment: Vercel at `https://unwrapped-tools.vercel.app` · Domain: `unwrapped.tools` pending

---

## Project Structure

```
src/
├── components/
│   ├── CommandPalette.tsx     # SolidJS, global Cmd+K palette
│   ├── CopyButton.tsx         # SolidJS, reusable copy button
│   ├── SettingsModal.tsx      # Theme and local-data controls
│   ├── ToolActionButton.tsx   # Shared action button baseline for tools
│   ├── ToolErrorFallback.tsx  # Tool load failure UI
│   ├── ToolHost.tsx           # Dynamic client tool loader + boundary
│   └── ToolStatusMessage.tsx  # Shared status and notice UI
├── layouts/
│   ├── Base.astro             # Standalone document shell for simple pages
│   └── EditorShell.astro      # Main app shell for home and tool routes
├── pages/
│   ├── index.astro            # / — Tool suite index inside EditorShell
│   ├── privacy.astro          # /privacy — local persistence contract
│   └── tools/
│       └── [slug].astro       # /tools/[slug] — Dynamic route for all tools
├── tools/
│   ├── registry.ts            # SINGLE SOURCE OF TRUTH — all tool metadata
│   ├── jwt-decoder/
│   │   └── JwtDecoder.tsx
│   ├── diff/
│   │   ├── DiffTool.tsx
│   │   ├── diffSession.ts
│   │   └── diffSession.test.ts
│   ├── base64/
│   │   └── Base64Tool.tsx
│   ├── json-formatter/
│   │   └── JsonFormatter.tsx
│   ├── hash-generator/
│   │   └── HashGenerator.tsx
│   ├── uuid-generator/
│   │   └── UuidGenerator.tsx
│   ├── timestamp/
│   │   └── TimestampTool.tsx
│   └── regex-tester/
│       └── RegexTester.tsx
├── lib/
│   ├── clipboard.ts          # Shared copy helper with fallback support
│   ├── diff.ts               # Diff engine (Myers algorithm via diff npm)
│   ├── diffAnalysis.ts       # Pure diff analysis helpers
│   ├── diffExecution.ts      # Main-thread or worker diff execution wrapper
│   ├── diff.worker.ts        # Worker entry for large diff execution
│   ├── diff.test.ts
│   ├── fileImport.ts         # Shared file import policy and helpers
│   ├── hash.ts               # Shared hash helpers
│   ├── jsonFormatter.ts      # JSON formatting and highlighting helpers
│   ├── jwt.ts                # JWT decode helpers
│   ├── language.ts           # Language type + constants
│   ├── languageDetection.ts  # File language heuristics
│   ├── structuredCompare.test.ts
│   ├── structuredCompare.ts  # JSON, TOML, YAML, and env normalization
│   ├── localPersistence.ts   # Shared local-storage key registry
│   ├── pwaRoute.ts           # Installed-session route recovery helpers
│   ├── regex.ts              # Regex analysis helpers
│   ├── search.ts             # Fuzzy search for command palette
│   ├── session.ts            # Versioned client session storage helpers
│   ├── theme.ts              # Theme persistence and bootstrap helpers
│   └── timestamp.ts          # Timestamp conversion helpers
└── styles/
    ├── themes.css            # Theme palettes as CSS custom properties
    └── global.css            # Global styles, fonts, Tailwind import
```

---

## Dev Commands

| Command                | Description                        |
| ---------------------- | ---------------------------------- |
| `bun dev`              | Start dev server at localhost:4321 |
| `bun build`            | Build for production to `dist/`    |
| `bun preview`          | Preview production build           |
| `bun run type-check`   | Run TypeScript type checking       |
| `bun run lint`         | Run ESLint                         |
| `bun run lint:fix`     | Run ESLint with auto-fix           |
| `bun run format`       | Format all files with Prettier     |
| `bun run format:check` | Check formatting without writing   |
| `bun run test`         | Run tests once                     |
| `bun run test:watch`   | Run tests in watch mode            |

---

## Theme System

Four CSS palettes defined in `src/styles/themes.css` as `:root[data-theme="..."]` selectors.

Available themes: `dracula` · `catppuccin` (default) · `nord` · `gruvbox`

CSS custom properties (use these in all components):

- `--bg-primary`, `--bg-secondary`, `--bg-tertiary`
- `--text-primary`, `--text-secondary`, `--text-muted`
- `--accent-primary`, `--accent-secondary`
- `--accent-success`, `--accent-warning`, `--accent-error`
- `--border`

Theme is persisted in `localStorage` under key `unwrapped-theme`. Inline bootstrap scripts in `Base.astro` and `EditorShell.astro` set `data-theme` before first paint to prevent flash.

---

## Tool Registry

`src/tools/registry.ts` is the **single source of truth** for all tools. To add a new tool:

1. Add an entry to the `tools` array in `registry.ts`
2. Create `src/tools/[slug]/ToolName.tsx` (SolidJS component)
3. Ensure the registry `componentPath` matches the component file path under `src/tools/`

Never hardcode tool metadata anywhere else.

Tool responsibilities:

- Tool components own tool-specific UI and orchestration.
- Shared libs in `src/lib/` own reusable logic, persistence helpers, file import policy, clipboard behavior, and runtime guards.
- Shared components in `src/components/` own repeated control patterns and failure boundaries.

---

## Tailwind CSS v4

- **No `tailwind.config.*` file** — configuration is in CSS
- **Import**: `@import "tailwindcss"` in `src/styles/global.css`
- **Custom theme**: `@theme` block in `global.css`
- **Arbitrary CSS vars**: Use `bg-[var(--bg-secondary)]` pattern in class names, or inline `style` attributes with `var(--...)` for complex theming

---

## TypeScript

- **Strict mode** via `astro/tsconfigs/strict`
- **Path alias**: `@` maps to `src/`

---

## Solid Components

All tool components are SolidJS `.tsx` files loaded with `client:load`.

- Use `createSignal`, `createEffect`, `onMount`, `onCleanup`, `For`, `Show`, etc.
- Props flow down; no global state library
- Keep business logic in `src/lib/`, not in components

---

## Local-Only Engineering Baseline

This repo is intentionally local-only. New features should preserve that baseline unless the user explicitly changes product direction.

- Do not add server-side tool processing, uploads, analytics beacons, or third-party telemetry.
- Do not persist tool inputs by default. If persistence is necessary, it must be documented, local-only, and registered in `src/lib/localPersistence.ts`.
- Use `src/lib/fileImport.ts` for file reads so size limits and error handling stay consistent.
- Service worker and PWA changes must preserve the local-only posture. Cached assets are fine; background upload or hidden sync is not.
- Clipboard, local storage, and worker usage should be best-effort and fail safely.
- Privacy and storage behavior exposed to users must stay aligned with `/privacy` and settings.

Current registered local persistence keys:

- `unwrapped-theme`
- `unwrapped-last-tool-route`
- `unwrapped-tool-session:diff`

Current shared runtime limits:

- Shared file import warning threshold: `512 KB`
- Shared file import hard limit: `2 MB`
- Diff persistence is preferences-only; compared content and imported file contents do not persist

---

## Dependency Decisions

| Need               | Solution                          | Why                                    |
| ------------------ | --------------------------------- | -------------------------------------- |
| Diff algorithm     | `diff` npm package                | Myers diff is solved CS                |
| JWT decoding       | Hand-rolled                       | Just `atob()` + padding fix            |
| Hashing            | Web Crypto API                    | Native browser                         |
| UUID               | `crypto.randomUUID()`             | Native browser                         |
| Icons              | `lucide-solid`                    | Tree-shakeable, developer-focused      |
| Themes             | CSS custom properties             | Zero JS, zero runtime                  |
| Fuzzy search       | Hand-rolled (`src/lib/search.ts`) | 30 lines, fast for 50 tools            |
| JSON formatting UI | Shared formatter utilities        | Small, local-only, no heavy UI runtime |

---

## ESLint

Config: `eslint.config.ts` (flat config format)

Key rules: `no-console` (warn), `sort-imports` (error), `@typescript-eslint/no-unused-vars` (error, ignores `_`-prefixed), `prefer-const`, `no-var` (error)

---

## Git Workflow

### Commit Convention

[Conventional Commits](https://www.conventionalcommits.org/): `<type>(<scope>): <description>`

Allowed types: `feat`, `fix`, `docs`, `refactor`, `chore`, `test`

### Branch Naming

```
feat/<short-description>
fix/<short-description>
docs/<short-description>
```

### PR Flow

Branch from `main` → commit → push → PR → CI must pass → squash merge

**Direct pushes to `main` are blocked.**

---

## CI/CD

- `ci.yml`: type-check, lint, format check, test, build on push/PR to main
- `audit.yml`: weekly bun audit --prod
- Production: Vercel at `https://unwrapped-tools.vercel.app` with `navigateFallback` limited to `/`
- Installed standalone sessions can reopen the last visited tool route from local storage
