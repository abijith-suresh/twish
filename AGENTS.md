# Agent & Contributor Instructions

This is the canonical instruction file for AI agents and contributors. `CLAUDE.md` is a symlink to this file.

---

## Project Overview

**unwrapped.tools** is a desktop-first, local-first PWA — a collection of fast developer tools. No server, no uploads, no tracking.

Stack: Astro 5 · SolidJS · Tailwind CSS v4 · TypeScript strict · Bun

Deployment: Vercel · Domain: unwrapped.tools (pending)

---

## Project Structure

```
src/
├── components/
│   ├── CommandPalette.tsx    # SolidJS, global Cmd+K palette
│   ├── ThemePicker.tsx       # SolidJS, 4-theme switcher
│   ├── CopyButton.tsx        # SolidJS, reusable copy button
│   ├── ToolGrid.astro        # Homepage tool grid (reads registry)
│   ├── ToolCard.astro        # Individual tool card
│   └── ToolShell.astro       # Per-tool wrapper: title, meta, breadcrumb
├── layouts/
│   └── Base.astro            # Single HTML shell (replaces 3 old layouts)
├── pages/
│   ├── index.astro           # / — Homepage
│   └── tools/
│       └── [slug].astro      # /tools/[slug] — Dynamic route (all tools)
├── tools/
│   ├── registry.ts           # SINGLE SOURCE OF TRUTH — all tool metadata
│   ├── jwt-decoder/
│   │   └── JwtDecoder.tsx    # Phase 1
│   ├── diff/
│   │   └── DiffTool.tsx      # Phase 2
│   ├── base64/
│   │   └── Base64Tool.tsx    # Phase 3
│   ├── json-formatter/
│   │   └── JsonFormatter.tsx # Phase 3
│   ├── hash-generator/
│   │   └── HashGenerator.tsx # Phase 4
│   ├── uuid-generator/
│   │   └── UuidGenerator.tsx # Phase 4
│   ├── timestamp/
│   │   └── TimestampTool.tsx # Phase 4
│   └── regex-tester/
│       └── RegexTester.tsx   # Phase 5
├── lib/
│   ├── diff.ts               # Diff engine (Myers algorithm via diff npm)
│   ├── diff.test.ts
│   ├── structuredCompare.ts  # JSON/YAML/env normalization
│   ├── structuredCompare.test.ts
│   ├── languageDetection.ts  # File language heuristics
│   ├── languageDetection.test.ts
│   ├── language.ts           # Language type + constants
│   ├── search.ts             # Fuzzy search for command palette
│   ├── clipboard.ts          # Copy to clipboard utility
│   └── theme.ts              # Theme persistence (localStorage)
└── styles/
    ├── themes.css            # 4 theme palettes as CSS custom properties
    └── global.css            # Resets, typography, Tailwind import
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

Available themes: `dracula` (default) · `catppuccin` · `nord` · `gruvbox`

CSS custom properties (use these in all components):

- `--bg-primary`, `--bg-secondary`, `--bg-tertiary`
- `--text-primary`, `--text-secondary`, `--text-muted`
- `--accent-primary`, `--accent-secondary`
- `--accent-success`, `--accent-warning`, `--accent-error`
- `--border`

Theme is persisted in `localStorage` under key `unwrapped-theme`. An inline script in `Base.astro` sets `data-theme` before first paint to prevent flash.

---

## Tool Registry

`src/tools/registry.ts` is the **single source of truth** for all tools. To add a new tool:

1. Add an entry to the `tools` array in `registry.ts`
2. Create `src/tools/[slug]/ToolName.tsx` (SolidJS component)
3. Add the import + render in `src/pages/tools/[slug].astro`

Never hardcode tool metadata anywhere else.

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

## Dependency Decisions

| Need                              | Solution                          | Why                               |
| --------------------------------- | --------------------------------- | --------------------------------- |
| Diff algorithm                    | `diff` npm package                | Myers diff is solved CS           |
| JWT decoding                      | Hand-rolled                       | Just `atob()` + padding fix       |
| Hashing                           | Web Crypto API                    | Native browser                    |
| UUID                              | `crypto.randomUUID()`             | Native browser                    |
| Icons                             | `lucide-solid`                    | Tree-shakeable, developer-focused |
| Themes                            | CSS custom properties             | Zero JS, zero runtime             |
| Fuzzy search                      | Hand-rolled (`src/lib/search.ts`) | 30 lines, fast for 50 tools       |
| Syntax highlight (JSON formatter) | `shiki` (Phase 3)                 | Zero runtime, VS Code quality     |

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
```

### PR Flow

Branch from `main` → commit → push → PR → CI must pass → squash merge

**Direct pushes to `main` are blocked.**

---

## CI/CD

- `ci.yml`: type-check, lint, format check, test, build on push/PR to main
- `audit.yml`: weekly bun audit --prod
- Production: Vercel at `https://unwrapped-tools.vercel.app` (domain: unwrapped.tools pending)
