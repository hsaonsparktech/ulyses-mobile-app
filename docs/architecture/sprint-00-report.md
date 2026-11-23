# Sprint 00 implementation report

Historical baseline. Branding/token availability is superseded by [Sprint 00A](sprint-00a-report.md); original verification outcomes below describe Sprint 00.

Date: 2026-11-15. Engineering foundation implemented; visual acceptance remains blocked by Figma reauthentication. No product screen implementation, backend connection, billing, Admin or Figma modifications were performed.

## Compatibility

Node 22.19.0 LTS; pnpm 10.32.1; Expo 57.0.33; React Native 0.86.3; React 19.2.3; Expo Router 57.0.31; NativeWind 4.2.7; Tailwind 3.4.17. The official tabs@sdk-57 template supplied the native version matrix. Expo install selected native package versions and Expo dependency validation confirms alignment. NativeWind 4.2.7 explicitly documents SDK 57, Reanimated 4/Worklets and the Tailwind 3/Babel preset/Metro combination. Newer SDK 58 and NativeWind v5 RC were deliberately not selected. Jest 29 matches jest-expo 57 dependencies; renderer matches React exactly. Biome is the only formatter/linter. No ESLint or Prettier dependency was added.

Sources verified before setup:

- [NativeWind stable installation and SDK 57 support](https://www.nativewind.dev/docs/getting-started/installation)
- [Expo SDK 57 reference](https://docs.expo.dev/versions/v57.0.0/)
- [Expo Router SDK 57](https://docs.expo.dev/versions/v57.0.0/sdk/router/)
- [SecureStore SDK 57](https://docs.expo.dev/versions/v57.0.0/sdk/securestore/)

Registry metadata and the official template were also inspected. pnpm-lock.yaml is the sole dependency lockfile. .npmrc uses hoisted linking for Expo/Jest compatibility. Native dependencies were installed through expo install.

## Verification

| Check                                  | Result                                                                                  |
| -------------------------------------- | --------------------------------------------------------------------------------------- |
| pnpm install                           | PASS; Husky prepare executed                                                            |
| pnpm typecheck                         | PASS; strict and unchecked index checks                                                 |
| pnpm lint                              | PASS; Biome                                                                             |
| pnpm test                              | PASS; 3 suites, 7 tests                                                                 |
| expo install --check                   | PASS; dependencies up to date                                                           |
| Expo Doctor                            | PASS; 21/21 checks                                                                      |
| Expo export Android and iOS            | PASS; final root app routes, Hermes bundles and font asset exported                     |
| Expo startup --offline on port 8087    | PASS; Metro ready, /status HTTP 200 and Android manifest HTTP 200; root confirmed ./app |
| Device/simulator runtime and visual QA | NOT RUN; no claim of native runtime acceptance                                          |
| Figma token and branding verification  | BLOCKED; both connections require reauthentication                                      |

Tests cover email/required fields, all access states and role destinations, user/business/role query-key isolation, semantic token naming without invented values, shared button action and loading lockout, fail-closed auth and cancellable development preview sign-in. Native bundling is a smoke check, not a signed store build. The offline startup process was stopped after inspection.

Warnings: Jest transitive packages include deprecated glob/inflight and jsdom-era utilities. They are not parallel application tooling. Offline startup cannot resolve remote manifest assets; local font bundling passed. NativeWind changed tsconfig includes as documented. Biome exempts only global.css from unknown-at-rule lint because Tailwind 3 uses @tailwind directives.

## Implemented foundation

- Thin root routes, auth layout and guarded role tab shells. All tab content explicitly reports foundation-only status.
- Session bootstrap/loading, unauthenticated redirects, forbidden state and authorized shells. Default production adapter fails closed; opt-in development mock never persists or grants API access.
- SecureStore credential boundary, Axios authorization/cancellation/normalized errors, Zod response helper, Query provider and scoped keys. Session transitions cancel and clear caches. Business switching is deferred until server contracts exist.
- Shared native Button, Input, Card, Text, Screen and feedback states; safe areas, scrolling, keyboard avoidance and device appearance.
- React Hook Form/Zod sample with field errors, pending lockout, failure feedback and successful mock navigation. Credentials do not enter mutation variables/caches.
- Font-loading gate and typed semantic-token/light-dark contracts. Actual Libros values, branding and typography are intentionally absent while access is blocked.
- Typed English common strings and Intl number/currency/date/time helpers. Spanish remains provisional.
- Biome, Husky/lint-staged, strict TypeScript, Jest, Git ignore integration and CI install/check/doctor/native exports.

## Configuration files

package.json, pnpm-lock.yaml, app.json, tsconfig.json, nativewind-env.d.ts, babel.config.js, metro.config.js, tailwind.config.js, global.css, biome.json, jest.config.js, .npmrc, .node-version, .env.example, .gitignore, .husky/pre-commit, .vscode settings/extensions and .github/workflows/ci.yml. Expo Router root is explicitly ./app because src/app contains composition utilities.

## Scripts

| Script    | Command                                                         |
| --------- | --------------------------------------------------------------- |
| start     | `expo start`                                                    |
| android   | `expo start --android`                                          |
| ios       | `expo start --ios`                                              |
| web       | `expo start --web`                                              |
| lint      | `biome check .`                                                 |
| lint:fix  | `biome check --write .`                                         |
| format    | `biome format --write .`                                        |
| typecheck | `tsc --noEmit`                                                  |
| test      | `jest --runInBand`                                              |
| check     | `pnpm typecheck && pnpm lint && pnpm test`                      |
| doctor    | `pnpm exec expo install --check && pnpm dlx expo-doctor@latest` |
| prepare   | `husky`                                                         |

Use `pnpm run doctor`: plain `pnpm doctor` invokes pnpm's built-in environment command. All other scripts can use pnpm <script>.

## Installed direct dependencies

| Kind            | Package                        | Manifest version |
| --------------- | ------------------------------ | ---------------- |
| dependencies    | @hookform/resolvers            | ^5.9.2           |
| dependencies    | @tanstack/react-query          | ^5.107.1         |
| dependencies    | axios                          | ^1.21.1          |
| dependencies    | expo                           | ~57.0.33         |
| dependencies    | expo-constants                 | ~57.0.24         |
| dependencies    | expo-font                      | ~57.0.4          |
| dependencies    | expo-linking                   | ~57.0.14         |
| dependencies    | expo-localization              | ~57.0.2          |
| dependencies    | expo-router                    | ~57.0.31         |
| dependencies    | expo-secure-store              | ~57.0.4          |
| dependencies    | expo-splash-screen             | ~57.0.11         |
| dependencies    | expo-status-bar                | ~57.0.1          |
| dependencies    | expo-symbols                   | ~57.0.3          |
| dependencies    | expo-web-browser               | ~57.0.3          |
| dependencies    | nativewind                     | 4.2.7            |
| dependencies    | react                          | 19.2.3           |
| dependencies    | react-dom                      | 19.2.3           |
| dependencies    | react-hook-form                | ^7.92.0          |
| dependencies    | react-native                   | 0.86.3           |
| dependencies    | react-native-reanimated        | 4.5.1            |
| dependencies    | react-native-safe-area-context | ~5.7.0           |
| dependencies    | react-native-screens           | ~4.26.0          |
| dependencies    | react-native-web               | ~0.21.0          |
| dependencies    | react-native-worklets          | 0.10.1           |
| dependencies    | zod                            | ^4.6.7           |
| dependencies    | zustand                        | ^5.1.0           |
| devDependencies | @biomejs/biome                 | ^2.6.7           |
| devDependencies | @testing-library/react-native  | ^13.3.3          |
| devDependencies | @types/jest                    | ^29.5.14         |
| devDependencies | @types/react                   | ~19.2.2          |
| devDependencies | babel-preset-expo              | ~57.0.17         |
| devDependencies | husky                          | ^9.1.7           |
| devDependencies | jest                           | ^29.7.0          |
| devDependencies | jest-expo                      | ~57.0.6          |
| devDependencies | lint-staged                    | ^16.4.0          |
| devDependencies | react-test-renderer            | 19.2.3           |
| devDependencies | tailwindcss                    | 3.4.17           |
| devDependencies | typescript                     | ~6.0.3           |

Resolved versions are pinned in pnpm-lock.yaml. Some official template modules remain available for future navigation/status/splash integration; unused template artwork is not official Libros branding.

## Actual generated tree

Excludes .git, node_modules, generated .expo and ignored dist artifacts.

```text
|-- .github/
|   `-- workflows/
|       `-- ci.yml
|-- .husky/
|   `-- pre-commit
|-- .vscode/
|   |-- extensions.json
|   `-- settings.json
|-- app/
|   |-- (auth)/
|   |   |-- _layout.tsx
|   |   `-- sign-in.tsx
|   |-- accountant/
|   |   |-- _layout.tsx
|   |   |-- account.tsx
|   |   |-- documents.tsx
|   |   |-- index.tsx
|   |   `-- reports.tsx
|   |-- employee/
|   |   |-- _layout.tsx
|   |   |-- account.tsx
|   |   |-- documents.tsx
|   |   |-- expenses.tsx
|   |   `-- index.tsx
|   |-- owner/
|   |   |-- _layout.tsx
|   |   |-- activity.tsx
|   |   |-- ai.tsx
|   |   |-- documents.tsx
|   |   |-- index.tsx
|   |   `-- invoices.tsx
|   |-- +not-found.tsx
|   |-- _layout.tsx
|   `-- index.tsx
|-- assets/
|   |-- branding/
|   |   `-- README.md
|   |-- fonts/
|   |   `-- SpaceMono-Regular.ttf
|   |-- icons/
|   |   `-- README.md
|   `-- images/
|       |-- android-icon-background.png
|       |-- android-icon-foreground.png
|       |-- android-icon-monochrome.png
|       |-- favicon.png
|       |-- icon.png
|       `-- splash-icon.png
|-- docs/
|   |-- api/
|   |   `-- README.md
|   |-- architecture/
|   |   |-- navigation.md
|   |   |-- open-decisions.md
|   |   |-- overview.md
|   |   |-- roadmap.md
|   |   `-- sprint-00-report.md
|   `-- figma/
|       `-- screen-map.md
|-- src/
|   |-- app/
|   |   `-- Providers.tsx
|   |-- components/
|   |   |-- feedback/
|   |   |   `-- Feedback.tsx
|   |   |-- layout/
|   |   |   `-- Screen.tsx
|   |   `-- ui/
|   |       |-- Button.tsx
|   |       |-- Card.tsx
|   |       |-- Input.tsx
|   |       `-- Text.tsx
|   |-- config/
|   |   `-- env.ts
|   |-- features/
|   |   |-- accountant/
|   |   |   `-- README.md
|   |   |-- ai/
|   |   |   `-- README.md
|   |   |-- auth/
|   |   |   |-- api/
|   |   |   |   `-- adapter.ts
|   |   |   |-- schemas/
|   |   |   |   `-- session.ts
|   |   |   `-- screens/
|   |   |       `-- SignInScreen.tsx
|   |   |-- businesses/
|   |   |   `-- README.md
|   |   |-- clients/
|   |   |   `-- README.md
|   |   |-- dashboard/
|   |   |   `-- README.md
|   |   |-- documents/
|   |   |   `-- README.md
|   |   |-- employee/
|   |   |   `-- README.md
|   |   |-- estimates/
|   |   |   `-- README.md
|   |   |-- invoices/
|   |   |   `-- README.md
|   |   |-- membership/
|   |   |   `-- README.md
|   |   |-- notifications/
|   |   |   `-- README.md
|   |   |-- onboarding/
|   |   |   `-- README.md
|   |   |-- reports/
|   |   |   `-- README.md
|   |   |-- scanning/
|   |   |   `-- README.md
|   |   |-- settings/
|   |   |   `-- README.md
|   |   |-- team/
|   |   |   `-- README.md
|   |   `-- transactions/
|   |       `-- README.md
|   |-- hooks/
|   |   `-- README.md
|   |-- lib/
|   |   |-- api/
|   |   |   `-- client.ts
|   |   |-- auth/
|   |   |   `-- README.md
|   |   |-- format/
|   |   |   `-- index.ts
|   |   |-- query/
|   |   |   |-- client.ts
|   |   |   `-- keys.ts
|   |   |-- storage/
|   |   |   `-- credentials.ts
|   |   `-- validation/
|   |       `-- README.md
|   |-- locales/
|   |   `-- en.ts
|   |-- mocks/
|   |   `-- auth-adapter.ts
|   |-- navigation/
|   |   |-- FoundationScreen.tsx
|   |   |-- RoleGuard.tsx
|   |   `-- access.ts
|   |-- providers/
|   |   `-- SessionProvider.tsx
|   |-- stores/
|   |   `-- ui.ts
|   |-- theme/
|   |   |-- ThemeProvider.tsx
|   |   `-- tokens.ts
|   `-- types/
|       |-- README.md
|       `-- styles.d.ts
|-- tests/
|   |-- Button.test.tsx
|   |-- auth-adapter.test.ts
|   `-- foundation.test.ts
|-- .env.example
|-- .gitignore
|-- .node-version
|-- .npmrc
|-- AGENTS.md
|-- LICENSE
|-- README.md
|-- app.json
|-- babel.config.js
|-- biome.json
|-- expo-env.d.ts
|-- global.css
|-- jest.config.js
|-- metro.config.js
|-- nativewind-env.d.ts
|-- package.json
|-- pnpm-lock.yaml
|-- tailwind.config.js
`-- tsconfig.json
```

## Run and next tasks

Run `pnpm android` for an Android device/emulator or `pnpm ios` on a supported iOS development host. Use a compatible SDK 57 Expo Go or development build. No native simulator test was executed.

Review Sprint 00, reconnect Figma and inspect exact pages/assets; integrate approved branding, fonts and tokens; agree backend auth/business/permissions contracts; then implement screens incrementally. See open-decisions.md, roadmap.md, navigation.md and ../figma/screen-map.md. No screen implementation should begin before review approval.
