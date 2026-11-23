# Architecture

One app with Expo Router pages in root `app/`. `src/app/Providers` composes safe areas, device appearance, TanStack Query and session bootstrap. The root gates navigation on font loading. Inter 400/600/700 load from licensed @expo-google-fonts/inter subpath imports before routes render. Load failures are explicit.

Feature code uses `src/features/<feature>/{screens,components,hooks,api,schemas,types,utils,__tests__}` as needed. Only auth has implementation. Other boundaries contain documentation, not dummy functionality. Shared code belongs in components/lib. Avoid private cross-feature imports and circular dependencies.

Query owns remote data. Zustand holds preview UI selection. Session metadata stays in context. Credentials belong only in SecureStore. The sample mutation takes void so credentials never enter mutation variables; password is cleared after submission.

Axios injects SecureStore bearer tokens, uses a timeout and accepts AbortSignal. `getValidated` validates unknown responses through Zod. No API endpoints or resource schemas are invented. Web credential persistence fails closed.

Query keys include user, role, business and resource. Mutations invalidate resource keys. Business/session changes must cancel all queries and clear caches before publishing a new context. Business switching is not exposed until server-authorized membership contracts exist.

The user-verified handoff supplies all 89 variables and nine Inter styles. src/theme/figma-tokens.json is the canonical value source for both Tailwind and typed React Native helpers. ThemeProvider binds all 26 RGB-channel variables with NativeWind vars() and responds to device appearance. Native navigation/status/safe-area colors use the same context. English common keys are typed; Intl helpers cover numbers, currencies, dates and time. Spanish is not shipped.
