# Libros mobile — Sprint 00

Engineering foundation only. All 105 Figma mobile build/state screens await Sprint 00 review before implementation. Admin is excluded.

Use Node 22.19 LTS and pnpm 10.32.1. Run `npm install -g pnpm@10.32.1` if needed, then restart your terminal to refresh PATH.

```sh
pnpm install --frozen-lockfile
pnpm start
pnpm android
pnpm ios
```

Android requires a device/emulator. Native iOS builds require macOS/Xcode. Expo Go must support SDK 57; otherwise use a compatible development build. No simulator/device execution has been verified here.

Copy `.env.example` to `.env`. All EXPO_PUBLIC values are public. The default API hostname deliberately cannot serve a backend. To explore shells locally set `EXPO_PUBLIC_ENABLE_MOCK_AUTH=true`, restart Metro, select a role and sign in with `preview@example.invalid` and any non-empty password. A wrong email demonstrates failure. Mock auth additionally requires `__DEV__`, never restores a session and grants no backend access. Production authentication fails closed until an approved adapter is connected.

`pnpm check` runs strict typecheck, Biome and Jest. `pnpm run doctor` checks Expo package alignment and Expo Doctor. Scripts also include `lint:fix`, `format`, `test`, `typecheck`, `web`. Husky runs lint-staged/Biome on staged supported files. CI also bundles Android and iOS.

Sprint 00A integrates the user-verified official Figma branding and all 89 variables (including 26 semantic colors in each mode), plus nine Inter styles. Tailwind and React Native share `src/theme/figma-tokens.json`. Device appearance selects the theme. Inter 400/600/700 load before routes render; failure shows an explicit error.

The original gray-textured tile is preserved byte-for-byte; the compact mark is the package's clearly labeled transparent derivative. Launcher and splash need release-device checks, especially in dark mode. Browser preview access was unavailable; no app screenshots or device runtime acceptance are claimed.

See [Sprint 00A report](docs/architecture/sprint-00a-report.md), [original Sprint 00 report](docs/architecture/sprint-00-report.md) and [Figma map](docs/figma/screen-map.md). Stop for review before Sprint 01 screens.
