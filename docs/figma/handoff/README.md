# Libros — Approved Brand & Figma Token Handoff

**Source:** https://www.figma.com/design/ynTITh3BXCJ5auNZaUEvkk/ulyses0930-%7C%7C-AI-Powered-Accounting---Financial-Management-Application
**Audited 2026-11-15 by live Figma MCP (read-only)**
**Target:** Antigravity / Codex, existing Expo SDK 57 app.

## What is included

- `branding/`: the exact approved app tile source SVG, exact-appearance original 1254px PNG and common-size PNGs, original editable source SVG, a clearly labeled **derived** transparent compact book mark (SVG + PNG), and SHA256 manifest.
- `tokens/figma-all-tokens.json`: the complete 89-variable readout, with 45 primitive hex colors, 26 semantic light/dark alias-resolution mappings, 11 spacing values and 7 radius values, plus nine Inter typography styles.
- `tokens/figma-semantic-light-dark.json`: direct Light/Dark hex mappings and Figma `VariableID` source aliases.
- `tokens/libros-figma-tokens.ts`: ready-to-adapt typed semantic values for the Expo codebase.
- `tokens/nativewind-rgb-channel-variables.json`: ready-to-bind RGB channel values, not a replacement for repository-specific Metro/Tailwind setup.
- `tokens/figma-all-colors.csv`: all 45 primitives and the 52 Light/Dark semantic color values for inspection.
- `previews/libros-light-dark-colors.html`: local side-by-side swatch viewer.
- `ANTIGRAVITY_INTEGRATION_PROMPT.md`: the integration instruction to paste into your coding agent.

## Source integrity

Figma component `371:77`, **LB / Brand / Official App Tile**, describes `open_book_icon_exact_appearance.svg` SHA256 `b113e6a1be013286762dd9641c4bcdc5a03bf426af4d8fd2dffbf59c4feab1ed`. File in ZIP matches exactly.

Figma component `371:88`, **LB / Brand / Open Book Symbol**, describes `open_book_icon_editable.svg` SHA256 `e7148f5eb3447737c5eb9cb5e4424d3166af31743a18170ed8eefabdf6dbe950`. File in ZIP matches exactly. Both Figma components were visually inspected via live screenshot.

The included transparent compact SVG is a **derivative** of the exact original SVG's `<g id="book-symbol">` vector paths, not a direct saved Figma export. It is convenient for Expo mobile headers; compare against node `371:88` when full Figma access is available. The approved original editable vector source *includes a white tile* and is not a standalone transparent mark.

The exact-appearance tile has intentionally present light-gray texture. Preserve it. It is not intended to be transparent.

Inter font metadata is included; no font files are distributed. Brand usage/license rights and mobile launcher checks are distinct release gates.

## Semantic color examples — retrieved, not guessed

| Token | Light | Dark |
|---|---|---|
| `color/canvas` | `#F6F8FB` | `#0A1422` |
| `color/surface` | `#FFFFFF` | `#142238` |
| `color/surfaceAlt` | `#EEF3FA` | `#1C2D46` |
| `color/surfaceRaised` | `#FFFFFF` | `#20314B` |
| `color/text` | `#13243C` | `#F4F7FC` |
| `color/muted` | `#52657C` | `#CAD6E7` |
| `color/tertiary` | `#64748B` | `#A8B8CA` |
| `color/border` | `#DCE4EE` | `#394B63` |
| `color/borderStrong` | `#B8C7D8` | `#5B6F8C` |
| `color/primary` | `#2459D8` | `#83A9FF` |
| `color/primaryHover` | `#1846B4` | `#A7C1FF` |
| `color/primarySoft` | `#EAF1FF` | `#263E66` |
| `color/primaryOn` | `#FFFFFF` | `#08172B` |
| `color/accent` | `#087E72` | `#56D4BB` |
| `color/accentSoft` | `#E5F5F1` | `#1C4B49` |

Additional 11 color entries and all primitive values are in the accompanying JSON/CSV. Source color alpha is 1; scrim transparency belongs to component usage, not these variables.

**Do not import account, tax, trial or membership behaviors from this visual token handoff.** All policy gates in the existing Figma handoff remain.
