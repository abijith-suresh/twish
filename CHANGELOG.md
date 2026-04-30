<!-- Entries below this line were manually maintained prior to automated release management -->

# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.6.1] - 2026-04-29

### Changed

- Hardened theme bootstrap and preference persistence so storage-restricted browsers keep the shell usable.
- Moved structured diff normalization out of the eager diff UI path, switched TOML handling to `smol-toml`, and reduced shipped diff bundle weight.
- Added explicit type-check coverage for Bun build scripts, refactored OG asset generation helpers, and reused the built app during route smoke verification to shorten `bun run verify`.

## [0.6.0] - 2026-04-05

### Added

- Informational pages, settings polish, and deeper workflow coverage for the mature `unwrapped.tools` shell.

### Changed

- Tightened privacy messaging, action baselines, and general platform coherence across the post-rebrand multi-tool experience.

## [0.5.1] - 2026-04-03

### Added

- Local session persistence for the diff workflow, TOML-aware structured compare, and stronger Base64 and Regex workflows.

### Changed

- Unified theme bootstrapping, tool registry execution, and shared persistence conventions across the platform.

### Fixed

- Recovered installed PWA sessions into tool routes and moved diff analysis off the main thread for smoother use.

## [0.5.0] - 2026-04-01

### Added

- The first `unwrapped.tools` release after the twish rebrand with a VS Code-style shell, command palette, and an initial multi-tool suite spanning JWT, diff, Base64, JSON formatting, hash, UUID, timestamp, and regex tools.

## [0.4.0] - 2026-03-28

### Added

- Twish's strongest pre-rebrand milestone with the config-compare workflow and a clearly release-worthy single-purpose product.

### Changed

- Established the mature product shape that directly informed the later pivot into a broader multi-tool platform.

## [0.3.0] - 2026-02-27

### Added

- A SolidJS-powered twish app with the raw CodeMirror editor, Live Split UX, and a more desktop-like diff workflow.

### Changed

- Shifted the product from a basic tool page into a more capable in-browser editing experience.

### Fixed

- Closed the main v1 blockers and performance issues before the config-compare milestone.

## [0.2.0] - 2026-02-23

### Added

- Vercel deployment and an industrial brutalist redesign for the marketing experience around twish.

### Changed

- Reframed the initial release with a stronger visual identity ahead of the heavier app rewrite.

## [0.1.0] - 2026-02-22

### Added

- Initial twish public release with landing/docs pages, diff tooling, PWA support, and open-source setup.

[unreleased]: https://github.com/abijith-suresh/unwrapped-tools/compare/v0.6.1...HEAD
[0.6.1]: https://github.com/abijith-suresh/unwrapped-tools/compare/v0.6.0...v0.6.1
[0.6.0]: https://github.com/abijith-suresh/unwrapped-tools/compare/v0.5.1...v0.6.0
[0.5.1]: https://github.com/abijith-suresh/unwrapped-tools/compare/v0.5.0...v0.5.1
[0.5.0]: https://github.com/abijith-suresh/unwrapped-tools/compare/v0.4.0...v0.5.0
[0.4.0]: https://github.com/abijith-suresh/unwrapped-tools/compare/v0.3.0...v0.4.0
[0.3.0]: https://github.com/abijith-suresh/unwrapped-tools/compare/v0.2.0...v0.3.0
[0.2.0]: https://github.com/abijith-suresh/unwrapped-tools/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/abijith-suresh/unwrapped-tools/releases/tag/v0.1.0
