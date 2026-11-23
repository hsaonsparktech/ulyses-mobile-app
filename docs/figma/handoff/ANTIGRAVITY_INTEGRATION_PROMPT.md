# Antigravity / Codex — Libros Sprint 00A: Integrate Verified Branding and Tokens

You have a previously initialized **Libros Expo SDK 57 / React Native 0.86.3 / NativeWind 4.2.7 / Tailwind 3.4.17** mobile project. Sprint 00 foundation checks previously passed. The agent's Figma MCP may require reauthentication, so the user has attached this verified handoff pack. **Do not delay the task merely because Figma MCP remains disconnected.** The attached files supply the verified color and brand sources.

## Mission

Implement the official Libros visual foundation in the **existing repository** by replacing temporary placeholder branding, guessed fonts and preview theme values with the verified assets/tokens from this ZIP. This is a **design-system integration only** sprint, not a build-all-screens task. Do not modify Figma, payment policy, backend contracts or role routing semantics.

## 1. First inspect existing code

Read `AGENTS.md`, `package.json`, `app.json`, `tailwind.config.js`, `global.css`, `src/theme/ThemeProvider.tsx`, `src/theme/tokens.ts`, the existing logo/font gate and the shared Button/Input/Card/Text/Screen components. Read `docs/architecture/sprint-00-report.md`, `docs/architecture/open-decisions.md` and existing tests. Keep pnpm and existing compatible dependency versions. Do not overwrite working logic or unrelated files.

## 2. Treat the attached pack as visual source of truth

Verified from Figma design file: https://www.figma.com/design/ynTITh3BXCJ5auNZaUEvkk/ulyses0930-%7C%7C-AI-Powered-Accounting---Financial-Management-Application

Figma logo masters:
- `371:77` — **Official App Tile**. Use the exact original gray-textured tile for launcher and splash/auth contexts. Prefer `branding/libros_app_tile_exact_1254.png` for raster render; `branding/open_book_icon_exact_appearance_OFFICIAL_SOURCE.svg` is the byte-identical user-supplied exact-appearance SVG with embedded raster. Preserve subtle gray texture and shape, do not flatten.
- `371:88` — **Compact Open Book Symbol**. `branding/libros_open_book_mark_transparent_DERIVED.svg` is a transparent-vector derivative of the approved SVG group. Its `DERIVED` name is deliberate: it is not an original export from the Figma API. If you can reconnect Figma, compare it to node 371:88 and use the exact exported node instead when necessary. Never redraw the logo or use emoji/letters as logo substitutes.
- `branding/open_book_icon_editable_OFFICIAL_SOURCE.svg` is the *original editable SVG source* with the white/gray tile and is **not pixel-identical** to the exact-appearance version.

**Do not overwrite business/customer uploaded invoice logos or business-initial avatars.**

Design variables (89 total):
- `tokens/figma-color-primitives.json` — all 45 primitive colors.
- `tokens/figma-semantic-light-dark.json` — all 26 semantic colors, both Light/Dark, with original Figma alias IDs and resolved hex values.
- `tokens/figma-spacing-radius.json` — 11 spacing values + 7 corner radii.
- `tokens/figma-typography.json` — nine Inter typography styles.
- `tokens/libros-figma-tokens.ts` — typed canonical values for TypeScript; safe to reuse/adapt.
- `tokens/nativewind-rgb-channel-variables.json` — optional correctly calculated RGB channels for NativeWind 4.

**Colors must exactly match tokens.** The primary light color is `#2459D8`, accent light `#087E72`, canvas light `#F6F8FB`, text light `#13243C`; use the supplied data for all other values, including dark mode. Avoid copying sampled colors from screenshots.

## 3. Expo/NativeWind integration

- Keep Expo SDK 57 / NativeWind 4.2.7 / Tailwind 3.4.17 unless version mismatch is actually reproduced and resolved.
- Integrate `libros-figma-tokens.ts` into `src/theme/tokens.ts` or an adjacent canonical module while preserving current public exports if possible.
- Implement light/dark token switching in `src/theme/ThemeProvider.tsx` using `useColorScheme` or the app's existing appearance contract.
- Wire semantic tokens to `tailwind.config.js` and, where applicable, NativeWind 4 `vars()` correctly. RGB channels are supplied if the existing Tailwind CSS color expressions use `rgb(var(--x) / <alpha-value>)`.
- Theme components must use semantic tokens (`canvas`, `surface`, `text`, `muted`, `border`, `primary`, etc.) instead of raw guessed hex.
- Use Figma's exact spacing and radius values; no one-off token guesses.
- Audit icon stroke color/selection states against the component library; do not introduce new glyph-based icons.
- Respect safe areas, dynamic text scaling and device appearance. Preserve tests and role tab behavior.

## 4. Branding and typography

- Copy official assets into the repository's existing `assets/branding` structure, preserving an asset manifest and original-source hash comments.
- Integrate PNGs safely into `app.json` icon and splash configuration **only if they meet Expo launcher/splash requirements**, preserve pixel proportions and foreground background behavior, and validate Expo config. A dark-background brand variant must be checked on device; do not invent an alternate logo.
- Create reusable `LibrosLogo` component with `variant: "tile" | "compact"`; ensure actual asset sizes/aspect ratios and accessible labeling. `react-native-svg` and an Expo-compatible transformer must be installed/configured only if needed for SVG; PNG is acceptable for the exact tile. Do not replace an exact logo with a hand-drawn icon.
- The design specifies **Inter**: 400, 600, 700 weights and sizes 12, 14, 16, 18, 22, 28, 32 and 36 as defined in `figma-typography.json`. Use legally acquired fonts from the Expo-compatible Inter package or another licensed source; **this archive deliberately does not distribute font files**.
- Remove placeholder SpaceMono references only after replacement fonts successfully load.

## 5. Preserve product boundaries

- Scope: only Owner, Employee and Accountant mobile app visual foundations. The platform Admin is a separate web console.
- Production auth stays fail-closed until backend integration; dev mock remains dev-only.
- Do not ship client-approval-pending Pro+ billing flows or Spanish demo screens as active production features.
- No hard-coded financial records or made-up backend endpoints.

## 6. Validate and report

Execute and record outcomes for `pnpm typecheck`, `pnpm lint`, `pnpm test`, `pnpm run doctor`, and Android/iOS export smoke checks. If feasible, visually inspect at least a welcome/sign-in shell and each role shell; flag simulator/device QA as NOT RUN if unavailable.

Also verify at least these properties:
- full textured app tile has correct original appearance, not a solid substitute;
- compact mark has transparent background (if using derived icon) and recognizable book gradients;
- all 26 semantic colors load correctly in Light and Dark;
- no missing local assets, unexpected path aliases or Metro failures;
- Inter fonts are loaded before rendering; no silent fallback;
- existing role guards and user/business query-cache isolation still pass;
- no Figma review-only screen accidentally became a production route.

Provide an implementation summary: modified paths, logo variant usage and hashes, theme examples (Light/Dark), tests, device tests not run, remaining visual differences, and next sprint recommendation. **Implement, do not merely describe.**
