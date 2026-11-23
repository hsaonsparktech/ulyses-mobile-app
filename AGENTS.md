# Libros engineering rules

- Sprint 00A branding/design-system integration only until reviewed; do not start Sprint 01 screens. Figma is the visual source of truth. Before implementing a screen, read its exact node and inspect assets. Do not invent branding or tokens.
- Use pnpm, strict TypeScript, Expo Router in root app/, NativeWind 4 and Biome. src/app contains composition only. Keep routes thin.
- Prefer shared components. Validate inputs and API responses with Zod.
- Backend authorization is authoritative. Client guards only control navigation.
- No hard-coded financial records, fake customer data, real credentials or fabricated backend functionality in production code.
- Every feature considers loading, empty, error and access-denied states.
- Pro+ policies and Spanish mockups are provisional.
- Credentials belong in SecureStore, never caches or logs. Cancel and clear queries on session/business changes.
- Use expo install for native dependencies and read matching SDK docs before changing Expo APIs.
- Confirm build, typecheck and lint after changes. Run pnpm check, pnpm run doctor and Expo exports when feasible. Report limitations accurately.

- The user-verified Figma handoff is approved visual source data. Keep src/theme/figma-tokens.json canonical for Tailwind and React Native. Preserve brand source bytes and derived provenance; never flatten the gray tile texture.
