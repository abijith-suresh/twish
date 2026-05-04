---
version: alpha
name: unwrapped.tools
description: Search-first, local-only developer utilities with a dark, editorial shell.
colors:
  primary: "#e4e4e9"
  secondary: "#9498a5"
  tertiary: "#34d399"
  neutral: "#09090b"
  surface: "#13141a"
  surface-strong: "#1c1d26"
  muted: "#5a5e6b"
  border: "#27272a"
  error: "#ef4444"
typography:
  display-mono:
    fontFamily: "JetBrains Mono, ui-monospace, monospace"
    fontSize: "4rem"
    fontWeight: 700
    lineHeight: 1.1
    letterSpacing: "-0.04em"
  hero-body:
    fontFamily: "Manrope Variable, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.25rem"
    fontWeight: 400
    lineHeight: 1.6
  body-md:
    fontFamily: "Manrope Variable, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.9375rem"
    fontWeight: 400
    lineHeight: 1.6
  body-sm:
    fontFamily: "Manrope Variable, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.8125rem"
    fontWeight: 400
    lineHeight: 1.45
  label-sans:
    fontFamily: "Manrope Variable, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 600
    lineHeight: 1.4
  label-mono:
    fontFamily: "JetBrains Mono, ui-monospace, monospace"
    fontSize: "0.8125rem"
    fontWeight: 400
    lineHeight: 1.5
  micro:
    fontFamily: "Manrope Variable, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.5625rem"
    fontWeight: 700
    lineHeight: 1.5
    letterSpacing: "0.06em"
rounded:
  none: "0px"
  xs: "3px"
  sm: "4px"
  md: "6px"
  lg: "8px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "20px"
  section: "40px"
  page-inline: "32px"
components:
  landing-frame:
    backgroundColor: "{colors.neutral}"
    textColor: "{colors.primary}"
    padding: "0 32px"
  divider-rule:
    backgroundColor: "{colors.border}"
    height: "1px"
  hero-brand:
    textColor: "{colors.primary}"
    typography: "{typography.display-mono}"
  search-bar:
    backgroundColor: transparent
    textColor: "{colors.primary}"
    rounded: "{rounded.none}"
    padding: "14px 20px"
    height: "52px"
  search-keycap:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.secondary}"
    rounded: "{rounded.sm}"
    padding: "1px 5px"
  result-meta:
    backgroundColor: transparent
    textColor: "{colors.muted}"
    typography: "{typography.label-mono}"
  search-result-row:
    backgroundColor: transparent
    textColor: "{colors.primary}"
    rounded: "{rounded.none}"
    padding: "14px 8px"
  search-result-row-active:
    backgroundColor: "{colors.surface-strong}"
    textColor: "{colors.primary}"
    rounded: "{rounded.none}"
    padding: "14px 8px"
  new-badge:
    backgroundColor: transparent
    textColor: "{colors.tertiary}"
    typography: "{typography.micro}"
    rounded: "{rounded.xs}"
    padding: "0 3px"
  footer-link:
    backgroundColor: transparent
    textColor: "{colors.secondary}"
    typography: "{typography.body-md}"
  settings-modal:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.primary}"
    rounded: "{rounded.md}"
    padding: "12px"
    width: "400px"
  danger-action:
    backgroundColor: transparent
    textColor: "{colors.error}"
    typography: "{typography.label-mono}"
    rounded: "{rounded.md}"
    padding: "6px 12px"
---

# Design System: unwrapped.tools

## Overview

**Creative North Star: "The Quiet Index"**

unwrapped.tools should feel less like a marketing site and more like a well-kept index of useful
things. The homepage is the clearest expression of that direction: a name, a sentence, a search
field, and the tools themselves. No hype layer. No dashboard theater. No decorative chrome asking
for attention before the work begins.

The mood is dark, calm, and technical without performing "developer aesthetic" too loudly. The
brand mark is monospace because the product is for people who live around code; the explanatory
copy stays in a warm sans because it has to read cleanly and quickly. The emerald accent behaves
like a cursor signal: rare, precise, and only present when something is active, searchable, or
worth noticing.

This direction should pull the whole product toward a search-first, list-first experience. The
landing page is not a temporary marketing wrapper around the app; it is the product's visual point
of view.

**Key characteristics:**
- Search-first discovery instead of card-grid browsing
- Full-bleed dark canvas with restrained border separators
- Monospace brand and metadata, sans-serif explanatory copy
- One accent color used as signal, never as decoration
- Flat surfaces with almost no resting chrome
- Local-only product posture reflected in the copy and restraint

## Colors

The palette is intentionally narrow. Most of the screen is near-black, the text lives in a tight
gray range, and the accent is a single emerald green. This keeps the interface quiet and makes the
active state legible without turning the product into a neon terminal parody.

- **Primary (`#e4e4e9`)**: Main foreground. Brand mark, tool names, modal titles, active text.
- **Secondary (`#9498a5`)**: Supporting copy. Footer links, hero pitch, secondary labels.
- **Tertiary (`#34d399`)**: Emerald signal color. Brand suffix, focus state, active rows, badges.
- **Neutral (`#09090b`)**: The canvas. The page background should read as continuous and edge to edge.
- **Surface (`#13141a`)**: Subtle contained surfaces: keycaps, modal panels, small control fills.
- **Surface Strong (`#1c1d26`)**: The deepest elevated surface. Used sparingly for active or overlay states.
- **Muted (`#5a5e6b`)**: Metadata and placeholders. Category labels, shortcuts, quiet affordances.
- **Border (`#27272a`)**: Rules, dividers, control outlines. Borders do most of the structural work.
- **Error (`#ef4444`)**: Destructive actions only.

**The Single Signal Rule.** Emerald appears when something is active, focusable, or newly added.
Do not spread it across large fills, hero gradients, or decorative backgrounds.

**The Dark-Only Rule.** The current product direction is a single dark palette. Do not document or
reintroduce alternate themes until the product direction changes for real.

## Typography

Typography carries the hierarchy more than color does.

- **Display Mono**: The wordmark and brand moments. Big, tight, unmistakably technical.
- **Hero Body**: The landing page pitch. Spacious enough to read, but still restrained.
- **Body MD / SM**: Search input, descriptions, footer links, and general UI copy.
- **Label Sans**: Tool names and compact emphasis inside result rows.
- **Label Mono**: Categories, counts, shortcuts, destructive utility labels.
- **Micro**: The `new` badge and similar tiny markers.

**The Two-Font Rule.** JetBrains Mono is for the identity layer and metadata. Manrope is for human
explanation. If text is meant to be scanned like a label, shortcut, category, or brand token, mono
is appropriate. If it is meant to be read as prose, use sans.

## Layout & Spacing

The layout is a single continuous column with one owner of horizontal padding. The content should
feel aligned as a page, not as stacked boxes.

- **Desktop landing hero:** two columns — brand block on the left, pitch on the right.
- **Mobile landing hero:** collapses to one column at `640px` and below.
- **Search results:** a bordered list, not a card grid. Rows stretch horizontally and rely on
  alignment, not containers, to feel organized.
- **Footer:** shares the same left and right edges as the main content. It should feel attached to
  the page frame, not like a separate slab.
- **Spacing rhythm:** compact by default. 4px and 8px are for micro-adjustments; 12–20px handle
  internal spacing; larger page spacing comes from responsive clamps in layout code.

The homepage already demonstrates the preferred pattern: brand, context, search, results, footer.
New surfaces should compose from that order instead of adding extra intermediary wrappers.

## Elevation & Depth

The system is flat by default. Depth is communicated through borders, tone changes, and occasional
contained surfaces — not by stacking cards and shadows.

- **Base plane:** the neutral page canvas.
- **Contained plane:** surface fills for keycaps and modal dialogs.
- **Active plane:** subtle tone shift on hovered or keyboard-selected rows.
- **Shadow usage:** reserved for the settings modal overlay only.

If a surface can be separated with a border or a 1-step tonal shift, do that before reaching for a
shadow.

## Shapes

The shape language is mostly square and editorial.

- Search bars and rows should read as straight-edged lines and separators, not pills.
- Small utility elements may use restrained rounding: 3px on badges, 4px on keycaps, 6px on
  overlays and utility buttons.
- Large rounded cards are not part of this direction.

The page should feel typeset and aligned, not soft and bubbly.

## Components

### Landing Frame

The landing page uses a single wrapper that owns horizontal padding. Main content and footer align
perfectly because they share that wrapper. This is foundational to the new direction.

### Hero

The hero is informational, not promotional. The product name is the headline; the descriptor line
and the right-column pitch are enough context. Do not add CTA buttons, trust badges, user counts,
or testimonial copy here.

### Search Bar

The search field is the primary interaction on the page. It should feel immediate and lightweight:
bordered, transparent, and always close to the results it filters. The page itself behaves like a
persistent command palette.

### Search Result Row

Result rows are table-like entries with four responsibilities: icon, name, category, description.
The row should fill horizontally, rely on border separators, and tint subtly on hover or keyboard
selection. Avoid card framing.

### New Badge

`new` is a tiny outlined marker attached to the tool name. It is not a promotional sticker.

### Footer Navigation

Footer links stay quiet, centered, and low-contrast. Settings is presented as a utility action,
not a primary navigation destination.

### Settings Modal

The settings modal is the only clearly elevated surface in this direction. It may use a shadow and
backdrop because it truly sits above the page. Keep it compact and utilitarian.

## Do's and Don'ts

### Do
- **Do** keep the homepage search-first. Discovery should happen in a list, not a gallery.
- **Do** use borders and alignment before introducing filled containers.
- **Do** keep the emerald accent rare and meaningful.
- **Do** let JetBrains Mono carry the brand, metadata, and shortcut language.
- **Do** preserve the local-only message in product copy: no uploads, no accounts, no tracking.
- **Do** respect `prefers-reduced-motion`; transitions should disappear cleanly.

### Don't
- **Don't** bring back the old shell language of sidebars, status bars, and feature-heavy card grids
  in new product-facing surfaces.
- **Don't** turn the landing page into a SaaS marketing hero with CTAs, metrics, or logos.
- **Don't** use large accent fills, gradient text, or decorative glow.
- **Don't** round everything into pills or cards.
- **Don't** reintroduce multi-theme storytelling in the design system while the product is intentionally dark-only.
- **Don't** add chrome that interrupts the fast path from page load to tool selection.
