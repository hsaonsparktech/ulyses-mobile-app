# Sprint 00A - Official branding and design-system integration

Date: 2026-11-15. Completed within the existing Sprint 00 application. Ready for review; Sprint 01 screens were not started.

## Implementation

The user-verified attached package is the visual source for this integration. The standalone JSON and TypeScript downloads match their ZIP entries byte-for-byte. The copied handoff and branding assets remain unmodified, outside Biome formatting scope. No Figma write or backend operation was performed.

- Canonical runtime source: src/theme/figma-tokens.json, including Figma metadata and source aliases. Tailwind requires that same JSON; typed React Native helpers import it. Archived handoff TS/JSON files are provenance/reference, not competing runtime configuration.
- All 45 primitives, 26 semantic colors in each Light/Dark mode, 11 spacings, seven radii and nine typography styles are present. Colors resolve through the supplied aliases; NativeWind RGB variables match every supplied channel value.
- ThemeProvider responds to device appearance and binds NativeWind vars() on the root native View. Text, inputs, buttons, cards, screen/safe-area backgrounds, feedback, selected tabs, navigation scenes and status bars use semantic tokens. Alpha is not invented for scrim.
- Inter 400/600/700 use licensed @expo-google-fonts/inter 0.4.2, imported via per-weight subpaths. Root useFonts gates routes; an explicit error replaces navigation on failure. Final bundles include only these three Inter faces. SIL OFL/package license copies are in assets/fonts. The old SpaceMono asset remains unused.
- All nine named typography variants preserve exact supplied sizes/weights. No unsupported line-height or tracking was invented. Native text scaling and scroll/keyboard/safe-area handling remain enabled.
- LibrosLogo offers tile and compact variants with accessible labels, contain scaling and source aspect ratios. Tile is used in sign-in, splash and launcher configuration; compact is used in existing role shells.
- Authentication guards, literal role routes/tab inventory, Zod form/schema behavior, fail-closed production auth, opt-in development mock, API boundary and query-cache scoping remain intact. No new product routes, membership behavior or Spanish demo screens were added.

## Light / Dark examples

| Semantic token | Light   | Dark    |
| -------------- | ------- | ------- |
| color/canvas   | #F6F8FB | #0A1422 |
| color/surface  | #FFFFFF | #142238 |
| color/text     | #13243C | #F4F7FC |
| color/muted    | #52657C | #CAD6E7 |
| color/border   | #DCE4EE | #394B63 |
| color/primary  | #2459D8 | #83A9FF |
| color/accent   | #087E72 | #56D4BB |
| color/focus    | #2459D8 | #B4D0FF |

All 26 per-mode entries are in the canonical JSON. The supplied [side-by-side swatch preview](../figma/handoff/previews/libros-light-dark-colors.html) is available for review; it is not an app screenshot.

## Brand integrity and usage

Manifest sources: tile master 371:77; compact master 371:88. Original SVG descriptions and hashes are retained in assets/branding/brand-asset-manifest.json. Every copied branding/token file was compared byte-for-byte with the ZIP.

| Asset                                               | Usage / verification                                        | SHA256                                                           |
| --------------------------------------------------- | ----------------------------------------------------------- | ---------------------------------------------------------------- |
| libros_app_tile_exact_1254.png                      | Unmodified 1254-square textured tile; sign-in/splash        | 32929c6505a6f231e0b64efa7cbb9d6b6649fab1709cca12423bbd40e2427b2e |
| libros_app_tile_1024.png                            | Opaque RGB 1024-square launcher PNG                         | 1031f762192781a21b9016377f7bad973e93b7b9dfa6ea97853e2bb9baf1102f |
| libros_open_book_mark_transparent_DERIVED.png       | 890x650 RGBA; contain/aspect ratio 890/650; role shells     | f2f5ae84eda9504a3aed8fd717acd1518f76699e0187908fcc8293466f710522 |
| open_book_icon_exact_appearance_OFFICIAL_SOURCE.svg | Archived original exact-appearance SVG                      | b113e6a1be013286762dd9641c4bcdc5a03bf426af4d8fd2dffbf59c4feab1ed |
| open_book_icon_editable_OFFICIAL_SOURCE.svg         | Archived editable source; intentionally not pixel-identical | e7148f5eb3447737c5eb9cb5e4424d3166af31743a18170ed8eefabdf6dbe950 |
| libros_open_book_mark_transparent_DERIVED.svg       | Archived supplied derivative, not a direct Figma export     | e4c6d829d48c512e8bd439eae4d1b6d896caa15c5a9b58ba4efb39d375729f09 |

The compact PNG was decoded without alteration: 209,949 fully transparent pixels and 366,112 fully opaque pixels, plus antialiased alpha values. Its gradients were visually inspected as a source image. The exact tile retains all original gray texture/shading; no cropping, flattening, recoloring or logo redrawing occurred. Launcher/splash use the full opaque tile with contain behavior; no guessed adaptive foreground or alternate dark logo was created. Customer logos were not touched.

## Verification

| Check                          | Result                                                                                              |
| ------------------------------ | --------------------------------------------------------------------------------------------------- |
| pnpm typecheck                 | PASS                                                                                                |
| pnpm lint                      | PASS; no warnings after excluding immutable source assets                                           |
| pnpm test                      | PASS; four suites, 11 tests                                                                         |
| pnpm run doctor                | PASS; Expo dependencies aligned, 21/21 Doctor checks                                                |
| Expo config resolution         | PASS; official icon/splash paths resolve                                                            |
| Android export / Hermes bundle | PASS                                                                                                |
| iOS export / Hermes bundle     | PASS                                                                                                |
| ZIP/manifest integrity         | PASS; every copied source byte matches, four manifest hashes verified                               |
| Theme parity                   | PASS; all aliases, both palettes, RGB channels, spacing/radii/type styles, native appearance switch |
| Logo proportions/accessibility | PASS; both variants tested                                                                          |
| Browser app screenshots        | UNAVAILABLE; browser access host rejected preview creation                                          |
| Device/simulator runtime       | NOT RUN                                                                                             |

The original seven foundation tests remain passing after updating the now-resolved token expectation. Four additional tests validate handoff parity, typography/spacing/radii, native Light/Dark appearance response and logo rendering proportions. Existing authentication cancellation, role-guard logic, query scope and button pending-lockout tests still pass. Bundles include both local brand PNGs and the three required Inter fonts.

## Modified / added paths

The repository baseline was already untracked in Git. This explicit integration inventory identifies touched paths; it is not inferred from git diff. No commit was created.

```text
AGENTS.md
README.md
package.json
pnpm-lock.yaml
app.json
biome.json
tailwind.config.js
app/_layout.tsx
app/owner/_layout.tsx
app/employee/_layout.tsx
app/accountant/_layout.tsx
src/theme/figma-tokens.json
src/theme/tokens.ts
src/theme/ThemeProvider.tsx
src/components/ui/LibrosLogo.tsx
src/components/ui/Button.tsx
src/components/ui/Input.tsx
src/components/ui/Card.tsx
src/components/ui/Text.tsx
src/components/layout/Screen.tsx
src/components/feedback/Feedback.tsx
src/features/auth/screens/SignInScreen.tsx
src/navigation/FoundationScreen.tsx
src/navigation/useShellOptions.ts
tests/foundation.test.ts
tests/theme.test.tsx
docs/architecture/overview.md
docs/architecture/open-decisions.md
docs/architecture/sprint-00-report.md
docs/architecture/sprint-00a-report.md
docs/figma/screen-map.md
assets/branding/brand-asset-manifest.json
assets/branding/libros_app_tile_1024.png
assets/branding/libros_app_tile_128.png
assets/branding/libros_app_tile_180.png
assets/branding/libros_app_tile_192.png
assets/branding/libros_app_tile_256.png
assets/branding/libros_app_tile_32.png
assets/branding/libros_app_tile_512.png
assets/branding/libros_app_tile_64.png
assets/branding/libros_app_tile_exact_1254.png
assets/branding/libros_open_book_mark_transparent_DERIVED.png
assets/branding/libros_open_book_mark_transparent_DERIVED.svg
assets/branding/open_book_icon_editable_OFFICIAL_SOURCE.svg
assets/branding/open_book_icon_exact_appearance_OFFICIAL_SOURCE.svg
assets/branding/README.md
docs/figma/handoff/ANTIGRAVITY_INTEGRATION_PROMPT.md
docs/figma/handoff/previews/libros-light-dark-colors.html
docs/figma/handoff/README.md
docs/figma/handoff/tokens/figma-all-colors.csv
docs/figma/handoff/tokens/figma-all-tokens.json
docs/figma/handoff/tokens/figma-color-primitives.json
docs/figma/handoff/tokens/figma-semantic-light-dark.json
docs/figma/handoff/tokens/figma-spacing-radius.json
docs/figma/handoff/tokens/figma-typography.json
docs/figma/handoff/tokens/libros-figma-tokens.ts
docs/figma/handoff/tokens/nativewind-rgb-channel-variables.json
assets/fonts/README.md
assets/fonts/Inter-LICENSE.txt
assets/fonts/Inter-LICENSE_FONT.txt
```

## Unresolved issues and release checks

1. Live Figma remains unavailable from the previously attempted connections. Package evidence resolves token/branding supply, but the DERIVED compact mark still needs comparison to live node 371:88 before final visual approval.
2. Browser access host is unavailable; no app screenshots or interactive shell visual inspection were captured. The source compact PNG was inspected and all shared role layouts compile, but this does not replace app visual QA.
3. No Android/iOS device or simulator run was performed. Verify platform launcher masking, standalone splash (especially Dark), font rendering/scaling, keyboard and safe areas on release builds. Expo Go does not reproduce all native splash behavior.
4. Brand redistribution rights remain a release-owner check. Inter font license is included. Supplied text styles do not specify line-height/tracking, so those values remain unspecified.
5. Existing backend contracts and membership/localization decisions remain unchanged and out of scope. Production sign-in continues to fail closed.

Next: review Sprint 00A and perform the above visual/device checks. Start Sprint 01 only after explicit approval and exact-screen Figma inspection.
