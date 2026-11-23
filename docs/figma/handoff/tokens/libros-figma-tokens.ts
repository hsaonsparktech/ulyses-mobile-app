// Extracted from Libros live Figma file on 2026-11-15.
// Source: LB / Semantic Colors (Light, Dark); values resolved from Figma aliases.
// No guessed colors. Do not change without approved Figma design changes.

export const librosPrimitives = {
  "hex/F6F8FB": "#F6F8FB",
  "hex/0A1422": "#0A1422",
  "hex/FFFFFF": "#FFFFFF",
  "hex/142238": "#142238",
  "hex/EEF3FA": "#EEF3FA",
  "hex/1C2D46": "#1C2D46",
  "hex/20314B": "#20314B",
  "hex/13243C": "#13243C",
  "hex/F4F7FC": "#F4F7FC",
  "hex/52657C": "#52657C",
  "hex/CAD6E7": "#CAD6E7",
  "hex/64748B": "#64748B",
  "hex/A8B8CA": "#A8B8CA",
  "hex/DCE4EE": "#DCE4EE",
  "hex/394B63": "#394B63",
  "hex/B8C7D8": "#B8C7D8",
  "hex/5B6F8C": "#5B6F8C",
  "hex/2459D8": "#2459D8",
  "hex/83A9FF": "#83A9FF",
  "hex/1846B4": "#1846B4",
  "hex/A7C1FF": "#A7C1FF",
  "hex/EAF1FF": "#EAF1FF",
  "hex/263E66": "#263E66",
  "hex/08172B": "#08172B",
  "hex/087E72": "#087E72",
  "hex/56D4BB": "#56D4BB",
  "hex/E5F5F1": "#E5F5F1",
  "hex/1C4B49": "#1C4B49",
  "hex/062623": "#062623",
  "hex/137754": "#137754",
  "hex/70D7A1": "#70D7A1",
  "hex/E5F6ED": "#E5F6ED",
  "hex/1F473C": "#1F473C",
  "hex/BC3C48": "#BC3C48",
  "hex/FF9BA7": "#FF9BA7",
  "hex/FDECEF": "#FDECEF",
  "hex/56313F": "#56313F",
  "hex/8A5700": "#8A5700",
  "hex/FFC870": "#FFC870",
  "hex/FFF2D7": "#FFF2D7",
  "hex/55432B": "#55432B",
  "hex/91B7FF": "#91B7FF",
  "hex/243D67": "#243D67",
  "hex/B4D0FF": "#B4D0FF",
  "hex/030812": "#030812"
} as const;

export const librosColors = {
  "Light": {
    "canvas": "#F6F8FB",
    "surface": "#FFFFFF",
    "surfaceAlt": "#EEF3FA",
    "surfaceRaised": "#FFFFFF",
    "text": "#13243C",
    "muted": "#52657C",
    "tertiary": "#64748B",
    "border": "#DCE4EE",
    "borderStrong": "#B8C7D8",
    "primary": "#2459D8",
    "primaryHover": "#1846B4",
    "primarySoft": "#EAF1FF",
    "primaryOn": "#FFFFFF",
    "accent": "#087E72",
    "accentSoft": "#E5F5F1",
    "accentOn": "#FFFFFF",
    "positive": "#137754",
    "positiveSoft": "#E5F6ED",
    "negative": "#BC3C48",
    "negativeSoft": "#FDECEF",
    "warning": "#8A5700",
    "warningSoft": "#FFF2D7",
    "info": "#2459D8",
    "infoSoft": "#EAF1FF",
    "focus": "#2459D8",
    "scrim": "#13243C"
  },
  "Dark": {
    "canvas": "#0A1422",
    "surface": "#142238",
    "surfaceAlt": "#1C2D46",
    "surfaceRaised": "#20314B",
    "text": "#F4F7FC",
    "muted": "#CAD6E7",
    "tertiary": "#A8B8CA",
    "border": "#394B63",
    "borderStrong": "#5B6F8C",
    "primary": "#83A9FF",
    "primaryHover": "#A7C1FF",
    "primarySoft": "#263E66",
    "primaryOn": "#08172B",
    "accent": "#56D4BB",
    "accentSoft": "#1C4B49",
    "accentOn": "#062623",
    "positive": "#70D7A1",
    "positiveSoft": "#1F473C",
    "negative": "#FF9BA7",
    "negativeSoft": "#56313F",
    "warning": "#FFC870",
    "warningSoft": "#55432B",
    "info": "#91B7FF",
    "infoSoft": "#243D67",
    "focus": "#B4D0FF",
    "scrim": "#030812"
  }
} as const;

export const librosSpacing = {
  "0": 0,
  "1": 4,
  "2": 8,
  "3": 12,
  "4": 16,
  "5": 20,
  "6": 24,
  "8": 32,
  "10": 40,
  "12": 48,
  "16": 64
} as const;

export const librosRadius = {
  "xs": 4,
  "sm": 8,
  "md": 12,
  "lg": 16,
  "xl": 20,
  "2xl": 24,
  "pill": 999
} as const;

export const librosTypography = {
  "Display": {
    "source": "LB / Display",
    "family": "Inter",
    "style": "Bold",
    "fontSize": 36,
    "weight": 700
  },
  "Heading": {
    "source": "LB / Heading",
    "family": "Inter",
    "style": "Bold",
    "fontSize": 28,
    "weight": 700
  },
  "Title": {
    "source": "LB / Title",
    "family": "Inter",
    "style": "Semi Bold",
    "fontSize": 22,
    "weight": 600
  },
  "Section": {
    "source": "LB / Section",
    "family": "Inter",
    "style": "Semi Bold",
    "fontSize": 18,
    "weight": 600
  },
  "Body": {
    "source": "LB / Body",
    "family": "Inter",
    "style": "Regular",
    "fontSize": 16,
    "weight": 400
  },
  "BodySmall": {
    "source": "LB / BodySmall",
    "family": "Inter",
    "style": "Regular",
    "fontSize": 14,
    "weight": 400
  },
  "Label": {
    "source": "LB / Label",
    "family": "Inter",
    "style": "Semi Bold",
    "fontSize": 14,
    "weight": 600
  },
  "Caption": {
    "source": "LB / Caption",
    "family": "Inter",
    "style": "Regular",
    "fontSize": 12,
    "weight": 400
  },
  "Amount": {
    "source": "LB / Amount",
    "family": "Inter",
    "style": "Bold",
    "fontSize": 32,
    "weight": 700
  }
} as const;

export type LibrosColorMode = keyof typeof librosColors;
export type LibrosColorToken = keyof typeof librosColors.Light;
export type LibrosTheme = typeof librosColors.Light | typeof librosColors.Dark;
export const getLibrosColors = (mode: LibrosColorMode) => librosColors[mode];
