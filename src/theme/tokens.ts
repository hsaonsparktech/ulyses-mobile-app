// Canonical values from the user-verified Figma handoff, 2026-11-15.
// The adjacent JSON retains Figma aliases and metadata; Tailwind reads the same file.
import source from "./figma-tokens.json";
export const librosPrimitives = source.primitives;
export const librosColors = source.semanticColors;
export const librosSpacing = source.spacing;
export const librosRadius = source.radius;
export const librosTypography = source.typography;
export type SemanticName = keyof typeof librosColors.Light;
export const semanticNames = Object.keys(librosColors.Light) as SemanticName[];
export type ThemeMode = "light" | "dark";
export type VerifiedTokens = Record<ThemeMode, Record<SemanticName, string>>;
export const verifiedTokens: VerifiedTokens = {
  light: librosColors.Light,
  dark: librosColors.Dark,
};
export function tokenName(name: SemanticName): `color/${SemanticName}` {
  return `color/${name}`;
}
export function cssVariable(name: SemanticName) {
  return `--lb-${name.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`)}`;
}
export function themeVariables(mode: ThemeMode) {
  return Object.fromEntries(
    semanticNames.map((name) => {
      const hex = verifiedTokens[mode][name].slice(1);
      return [
        cssVariable(name),
        [0, 2, 4]
          .map((offset) => Number.parseInt(hex.slice(offset, offset + 2), 16))
          .join(" "),
      ];
    }),
  );
}
export type TypographyName = keyof typeof librosTypography;
export const interFamilies: Record<number, string> = {
  400: "Inter_400Regular",
  600: "Inter_600SemiBold",
  700: "Inter_700Bold",
};
export function typographyStyle(name: TypographyName) {
  const token = librosTypography[name];
  return {
    fontFamily: interFamilies[token.weight],
    fontSize: token.fontSize,
    lineHeight: token.lineHeight,
  };
}
