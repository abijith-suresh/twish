# astro-template

An opinionated Astro 5 starter template with Tailwind CSS v4, TypeScript strict mode, ESLint, Prettier, Husky, commitlint, Vitest, DevContainer, and GitHub Actions.

## Stack

- [Astro 5](https://astro.build) — static site framework
- [Tailwind CSS v4](https://tailwindcss.com) — utility-first CSS (via `@tailwindcss/vite`)
- [TypeScript](https://www.typescriptlang.org) — strict mode
- [Bun](https://bun.sh) — package manager and runtime
- [ESLint](https://eslint.org) — linting (flat config)
- [Prettier](https://prettier.io) — formatting
- [Husky](https://typicode.github.io/husky) + [commitlint](https://commitlint.js.org) — git hooks
- [Vitest](https://vitest.dev) — unit testing
- [GitHub Actions](https://github.com/features/actions) — CI + deploy to GitHub Pages
- [DevContainer](https://containers.dev) — reproducible dev environment

## Use This Template

Click the **"Use this template"** button at the top of this repo, then:

1. Clone your new repo
2. Install dependencies:
   ```sh
   bun install
   ```
3. Update `name` in `package.json`
4. Update `site` and `base` in `astro.config.ts`:
   ```ts
   site: "https://YOUR-USERNAME.github.io",
   base: "/YOUR-REPO-NAME/",
   ```
5. Update the `name` field in `.devcontainer/devcontainer.json`
6. Enable GitHub Pages: **Settings → Pages → Source: GitHub Actions**
7. Replace `AGENTS.md` with project-specific instructions

## Development

```sh
bun dev          # start dev server at localhost:4321
bun build        # build for production
bun preview      # preview production build
bun run lint     # run ESLint
bun run format   # run Prettier
bun run test     # run tests
```

See [AGENTS.md](./AGENTS.md) for the full list of commands and project conventions.

## Project Structure

```
src/
├── layouts/Layout.astro   # base HTML shell
├── pages/index.astro      # entry point
├── styles/global.css      # Tailwind CSS import
└── test/setup.ts          # Vitest setup
```

## License

MIT
