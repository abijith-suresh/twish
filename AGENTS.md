# Agent & Contributor Instructions

This is the canonical instruction file for AI agents and contributors. `CLAUDE.md` is a symlink to this file.

---

## Project Overview

**twish** is a fully offline, client-side PWA for comparing text files — configs, code, and plain text. No server, no uploads, no tracking.

Stack: Astro 5 · React · Tailwind CSS v4 · CodeMirror 6 · TypeScript strict · Bun

---

## Project Structure

```
src/
├── components/
│   ├── layout/
│   │   ├── Header.astro          # Top nav — logo + page links + GitHub link
│   │   └── Footer.astro          # Minimal footer
│   ├── landing/
│   │   ├── Hero.astro            # Landing page hero section
│   │   └── FeatureCard.astro     # Reusable feature highlight card
│   └── app/                      # React components (client-side only)
│       ├── DiffApp.tsx           # Root state manager
│       ├── EditorPanel.tsx       # CodeMirror editor + drag-and-drop + file open
│       ├── DiffView.tsx          # Side-by-side diff output
│       ├── LanguageSelector.tsx  # Language dropdown for syntax highlighting
│       └── Toolbar.tsx           # Compare / Swap / Clear buttons
├── layouts/
│   ├── BaseLayout.astro          # HTML shell, meta, OG tags, PWA manifest
│   ├── MarketingLayout.astro     # BaseLayout + Header + Footer
│   └── AppLayout.astro           # BaseLayout + minimal Header (full-screen tool)
├── pages/
│   ├── index.astro               # / — Landing page
│   ├── features.astro            # /features
│   ├── about.astro               # /about
│   ├── docs.astro                # /docs
│   ├── changelog.astro           # /changelog
│   └── app.astro                 # /app — the diff tool
├── styles/
│   └── global.css                # Tailwind import + custom theme vars
├── test/
│   └── setup.ts                  # Vitest setup
└── env.d.ts                      # Astro type reference
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
| `bun run test:ui`      | Open Vitest UI                     |

---

## Tailwind CSS v4

- **No `tailwind.config.*` file** — configuration is done in CSS
- **Import in CSS**: `@import "tailwindcss"` in `src/styles/global.css`
- **Custom theme**: Use `@theme` block in `global.css` instead of a JS config file
- **Vite plugin**: `@tailwindcss/vite` in `astro.config.ts`

---

## TypeScript

- **Strict mode** via `astro/tsconfigs/strict`
- **Path alias**: `@` maps to `src/` — use `@/components/Foo.astro` instead of relative paths

---

## React Components (in `/app`)

All React components live in `src/components/app/` and are loaded with `client:load` in `src/pages/app.astro`.

- State is managed in `DiffApp.tsx` — pass props/callbacks down; don't use a state library
- Keep components focused; avoid putting business logic in Astro files
- The diff engine (`diff` package) is called in `DiffApp.tsx` only

---

## ESLint

Config: `eslint.config.ts` (flat config format)

Key rules:

- `no-console`: warn (allows `console.warn` and `console.error`)
- `sort-imports`: error (case-insensitive, declaration sort ignored)
- `@typescript-eslint/no-unused-vars`: error (ignores `_`-prefixed names)
- `prefer-const`, `no-var`: error

---

## Prettier

Config: `.prettierrc`

- `printWidth: 100`, `singleQuote: false`, `trailingComma: "es5"`
- Astro plugin enabled for `.astro` files

---

## Testing (Vitest)

- **Environment**: jsdom
- **Globals**: enabled
- **Test files**: `src/**/*.{test,spec}.{js,ts}`
- Utility functions (diff logic, language detection) should have unit tests

---

## Git Workflow

### Commit Convention

Uses [Conventional Commits](https://www.conventionalcommits.org/).

Allowed types: `feat`, `fix`, `docs`, `refactor`, `chore`, `test`

Format: `<type>(<optional scope>): <description>`

### Branch Naming

```
feat/<short-description>
fix/<short-description>
docs/<short-description>
chore/<short-description>
```

### PR Flow

1. Branch from `main`
2. Commit with conventional format
3. Push and open PR against `main`
4. CI must pass
5. No reviewers required — self-merge is fine
6. Squash merge preferred

**Direct pushes to `main` are blocked by a branch ruleset.**

---

## CI/CD

### `ci.yml`

Triggered on push to `main` and all PRs. Runs type-check, lint, format check, test, build.

### `deploy.yml`

Triggered on push to `main`. Deploys to GitHub Pages at `https://abijith-suresh.github.io/twish`.

Requires: GitHub Pages enabled in Settings → Pages → Source: GitHub Actions.

### `audit.yml`

Runs weekly. Audits production dependencies with `bun audit --prod`.

---

## PWA

- **Manifest**: defined in `astro.config.ts` via `@vite-pwa/astro`
- **Icons**: `public/icons/icon-192.png` and `public/icons/icon-512.png`
- **Service worker**: Workbox cache-first strategy for all static assets
- **Offline**: app must work fully offline after first load

---

## DevContainer

- **Base image**: `node:24-slim` with Bun and GitHub CLI
- **Port**: 4321 forwarded for Astro dev server
- **Post-create**: `bun install` runs automatically
