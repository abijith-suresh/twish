# twish

A fully offline, installable PWA for comparing files — configs, code, or plain text — without any data leaving your browser.

Built because managing multiple configs across environments gets cumbersome. No server, no uploads, no tracking.

Live at: **[abijith-suresh.github.io/twish](https://abijith-suresh.github.io/twish)**

## Features

- **Side-by-side diff** — clean split view with line-level highlighting
- **Rich code editor** — CodeMirror 6 with syntax highlighting for JSON, YAML, JS/TS, Python, Markdown, XML, and more
- **Drag & drop** — drop any text file onto either panel to load it
- **Offline-first PWA** — works with no internet after the first visit; installable as a desktop/mobile app
- **Keyboard shortcuts** — `Ctrl+Enter` to diff, `Ctrl+O` to open a file, `Ctrl+Shift+C` to clear
- **No data sent anywhere** — purely client-side, all processing in your browser

## Stack

- [Astro 5](https://astro.build) — static site framework
- [React](https://react.dev) — interactive diff tool
- [Tailwind CSS v4](https://tailwindcss.com) — utility-first CSS
- [CodeMirror 6](https://codemirror.net) — code editor
- [diff](https://github.com/kpdecker/jsdiff) — diffing engine
- [Bun](https://bun.sh) — package manager and runtime
- [GitHub Actions](https://github.com/features/actions) — CI + deploy to GitHub Pages

## Development

```sh
bun install        # install dependencies
bun dev            # start dev server at localhost:4321
bun build          # build for production
bun preview        # preview production build
bun run lint       # run ESLint
bun run format     # run Prettier
bun run test       # run tests
bun run type-check # TypeScript check
```

See [AGENTS.md](./AGENTS.md) for full commands, project conventions, and AI agent instructions.

## Project Structure

```
src/
├── components/
│   ├── layout/        # Header, Footer
│   ├── landing/       # Hero, FeatureCard
│   └── app/           # React diff tool components
├── layouts/
│   ├── BaseLayout.astro
│   ├── MarketingLayout.astro
│   └── AppLayout.astro
├── pages/
│   ├── index.astro    # Landing page
│   ├── features.astro
│   ├── about.astro
│   ├── docs.astro
│   ├── changelog.astro
│   └── app.astro      # The diff tool
└── styles/
    └── global.css
```

## Contributing

All contributions welcome — open an issue or PR. See [AGENTS.md](./AGENTS.md) for code conventions and branch/commit rules.

## License

[MIT](./LICENSE)
