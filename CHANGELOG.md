<!-- Entries below this line were manually maintained prior to automated release management -->

# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.6.4](https://github.com/abijith-suresh/unwrapped/compare/v0.6.3...v0.6.4) (2026-07-14)


### Features

* add component primitive library and playground page ([#160](https://github.com/abijith-suresh/unwrapped/issues/160)) ([1c97723](https://github.com/abijith-suresh/unwrapped/commit/1c9772337938830a69fd671c6e111dad485c39b9))


### Bug Fixes

* remove stale debounce from regex tester replacement input ([#179](https://github.com/abijith-suresh/unwrapped/issues/179)) ([243ca37](https://github.com/abijith-suresh/unwrapped/commit/243ca372f51feec54f362203ffa49a99c8caa661))

## [0.6.3](https://github.com/abijith-suresh/unwrapped/compare/v0.6.2...v0.6.3) (2026-05-31)


### Features

* **core:** harden the current tool suite before tool-page redesign ([#138](https://github.com/abijith-suresh/unwrapped/issues/138)) ([3e52cf3](https://github.com/abijith-suresh/unwrapped/commit/3e52cf39705e952fa9f9982944f80fc871cc8cec))
* **cron:** add humanized schedule output and next-run previews ([#152](https://github.com/abijith-suresh/unwrapped/issues/152)) ([943b258](https://github.com/abijith-suresh/unwrapped/commit/943b258e9dcb872604db288a3e90f45e24496edc))
* **data:** add a JSON to CSV converter ([#148](https://github.com/abijith-suresh/unwrapped/issues/148)) ([0eb3bcc](https://github.com/abijith-suresh/unwrapped/commit/0eb3bcc98b3c51f31c85981089ad1ba9ad1c33f9))
* **data:** add a JSON to YAML converter ([#144](https://github.com/abijith-suresh/unwrapped/issues/144)) ([24e576d](https://github.com/abijith-suresh/unwrapped/commit/24e576d1a7328f7b4139ad17a746be40b08de093))
* **data:** add a YAML formatter ([#146](https://github.com/abijith-suresh/unwrapped/issues/146)) ([c4ea5cd](https://github.com/abijith-suresh/unwrapped/commit/c4ea5cd2e78578822e8a97c53b4f5ec77bd81705))
* **data:** add a YAML to JSON converter ([#145](https://github.com/abijith-suresh/unwrapped/issues/145)) ([282f2d4](https://github.com/abijith-suresh/unwrapped/commit/282f2d46462c2053d2f6e3ee995f86ef85f96f55))
* **data:** add an XML formatter ([#147](https://github.com/abijith-suresh/unwrapped/issues/147)) ([6101f0c](https://github.com/abijith-suresh/unwrapped/commit/6101f0c477cd57164288c101638d1ced517a9c94))
* **encoding:** add a URL encoder and decoder ([#142](https://github.com/abijith-suresh/unwrapped/issues/142)) ([b15f814](https://github.com/abijith-suresh/unwrapped/commit/b15f814d76a1d39357efcf3483a7f6a768b29cfa))
* **generators:** add a configurable random token generator ([#141](https://github.com/abijith-suresh/unwrapped/issues/141)) ([2550f67](https://github.com/abijith-suresh/unwrapped/commit/2550f671dbbaeb9eae9d73284c5ed3d90863ed68))
* **network:** add an HTTP status code reference ([#143](https://github.com/abijith-suresh/unwrapped/issues/143)) ([56d3c95](https://github.com/abijith-suresh/unwrapped/commit/56d3c95a23a232b0fcc518593f542e4f3eea2d1d))
* redesign landing page around tool search ([#136](https://github.com/abijith-suresh/unwrapped/issues/136)) ([f7bde61](https://github.com/abijith-suresh/unwrapped/commit/f7bde6128f98c0c4b574152638f71f6389e110fd))
* **security:** add a chmod permission calculator ([#149](https://github.com/abijith-suresh/unwrapped/issues/149)) ([c14c299](https://github.com/abijith-suresh/unwrapped/commit/c14c2996f9dbd906a2439c1ab3e47635f7c740df))
* **security:** add an HMAC generator ([#150](https://github.com/abijith-suresh/unwrapped/issues/150)) ([ec8dc83](https://github.com/abijith-suresh/unwrapped/commit/ec8dc837ef995962a283a7593749de919794f59f))
* **text:** add a case converter ([#139](https://github.com/abijith-suresh/unwrapped/issues/139)) ([2df147a](https://github.com/abijith-suresh/unwrapped/commit/2df147aa8bb6b036034b4f241c4664165bf16e6c))
* **text:** add a text statistics tool ([#140](https://github.com/abijith-suresh/unwrapped/issues/140)) ([84bb55b](https://github.com/abijith-suresh/unwrapped/commit/84bb55b8a2e48df77c98e1545173137b5293056f))
* **url:** add a local-only URL and query string inspector ([#151](https://github.com/abijith-suresh/unwrapped/issues/151)) ([8e876d4](https://github.com/abijith-suresh/unwrapped/commit/8e876d41bd52566399994038034424637d4b652e))

## [0.6.2](https://github.com/abijith-suresh/unwrapped/compare/v0.6.1...v0.6.2) (2026-05-03)


### Bug Fixes

* UI critique polish — a11y, font system, sidebar, changelog ([#112](https://github.com/abijith-suresh/unwrapped/issues/112)) ([2c189c3](https://github.com/abijith-suresh/unwrapped/commit/2c189c3a50e80e5d667c3d12cd10c026a33f43b0))

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

[unreleased]: https://github.com/abijith-suresh/unwrapped/compare/v0.6.1...HEAD
[0.6.1]: https://github.com/abijith-suresh/unwrapped/compare/v0.6.0...v0.6.1
[0.6.0]: https://github.com/abijith-suresh/unwrapped/compare/v0.5.1...v0.6.0
[0.5.1]: https://github.com/abijith-suresh/unwrapped/compare/v0.5.0...v0.5.1
[0.5.0]: https://github.com/abijith-suresh/unwrapped/compare/v0.4.0...v0.5.0
[0.4.0]: https://github.com/abijith-suresh/unwrapped/compare/v0.3.0...v0.4.0
[0.3.0]: https://github.com/abijith-suresh/unwrapped/compare/v0.2.0...v0.3.0
[0.2.0]: https://github.com/abijith-suresh/unwrapped/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/abijith-suresh/unwrapped/releases/tag/v0.1.0
