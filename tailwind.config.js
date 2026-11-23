// Single canonical token source shared with React Native. No sampled values.
const tokens = require("./src/theme/figma-tokens.json");
const variable = (name) =>
  `--lb-${name.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`)}`;
const pixels = (values) =>
  Object.fromEntries(
    Object.entries(values).map(([key, value]) => [key, `${value}px`]),
  );
module.exports = {
  content: ["./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  presets: [require("nativewind/preset")],
  darkMode: "media",
  theme: {
    colors: Object.fromEntries(
      Object.keys(tokens.semanticColors.Light).map((name) => [
        name,
        `rgb(var(${variable(name)}) / <alpha-value>)`,
      ]),
    ),
    spacing: pixels(tokens.spacing),
    borderRadius: pixels(tokens.radius),
    fontFamily: {
      inter: ["Inter_400Regular"],
      "inter-semibold": ["Inter_600SemiBold"],
      "inter-bold": ["Inter_700Bold"],
    },
    fontSize: Object.fromEntries(
      Object.entries(tokens.typography).map(([name, value]) => [
        name,
        [`${value.fontSize}px`, { lineHeight: `${value.lineHeight}px` }],
      ]),
    ),
  },
  plugins: [],
};
