import { render } from "@testing-library/react-native";
import * as ReactNative from "react-native";
import { StyleSheet } from "react-native";
import { LibrosLogo } from "@/components/ui/LibrosLogo";
import { Text } from "@/components/ui/Text";
import { ThemeProvider } from "@/theme/ThemeProvider";
import {
  librosPrimitives,
  librosRadius,
  librosSpacing,
  librosTypography,
  semanticNames,
  themeVariables,
  typographyStyle,
  verifiedTokens,
} from "@/theme/tokens";

test("device appearance changes both React Native text colors and typography", () => {
  const appearance = jest.spyOn(ReactNative, "useColorScheme");
  appearance.mockReturnValue("light");
  const view = render(
    <ThemeProvider>
      <Text variant="Title" tone="primary">
        Theme probe
      </Text>
    </ThemeProvider>,
  );
  expect(
    StyleSheet.flatten(view.getByText("Theme probe").props.style),
  ).toMatchObject({
    color: "#2459D8",
    fontFamily: "Inter_600SemiBold",
    fontSize: 22,
    lineHeight: 30,
  });
  appearance.mockReturnValue("dark");
  view.rerender(
    <ThemeProvider>
      <Text variant="Title" tone="primary">
        Theme probe
      </Text>
    </ThemeProvider>,
  );
  expect(
    StyleSheet.flatten(view.getByText("Theme probe").props.style).color,
  ).toBe("#83A9FF");
  appearance.mockRestore();
});

import source from "../docs/figma/handoff/tokens/figma-all-tokens.json";
import rgbSource from "../docs/figma/handoff/tokens/nativewind-rgb-channel-variables.json";

test("all Figma aliases and NativeWind RGB channels match the verified handoff", () => {
  expect(Object.keys(librosPrimitives)).toHaveLength(45);
  expect(semanticNames).toHaveLength(26);
  for (const [mode, figmaMode] of [
    ["light", "Light"],
    ["dark", "Dark"],
  ] as const) {
    expect(verifiedTokens[mode]).toEqual(source.semanticColors[figmaMode]);
    expect(themeVariables(mode)).toEqual(rgbSource.variablesByMode[figmaMode]);
    for (const [name, alias] of Object.entries(source.sourceAliases)) {
      const key = name.replace(
        "color/",
        "",
      ) as keyof typeof verifiedTokens.light;
      expect(verifiedTokens[mode][key]).toBe(alias[figmaMode].hex);
      expect(
        source.primitives[
          alias[figmaMode].ref as keyof typeof source.primitives
        ],
      ).toBe(alias[figmaMode].hex);
    }
  }
});

test("spacing, radii and all nine Inter styles preserve source values", () => {
  expect(librosSpacing).toEqual(source.spacing);
  expect(Object.keys(librosSpacing)).toHaveLength(11);
  expect(librosRadius).toEqual(source.radius);
  expect(Object.keys(librosRadius)).toHaveLength(7);
  expect(librosTypography).toEqual(source.typography);
  expect(Object.keys(librosTypography)).toHaveLength(9);
  for (const name of Object.keys(
    librosTypography,
  ) as (keyof typeof librosTypography)[]) {
    expect(typographyStyle(name).fontSize).toBe(
      source.typography[name].fontSize,
    );
    expect(typographyStyle(name).lineHeight).toBe(
      source.typography[name].lineHeight,
    );
    expect(typographyStyle(name).fontFamily).toMatch(
      /^Inter_(400Regular|600SemiBold|700Bold)$/,
    );
  }
});

test("logo variants preserve square tile and compact source proportions", () => {
  const view = render(<LibrosLogo variant="tile" width={128} />);
  expect(
    StyleSheet.flatten(
      view.getByLabelText("Libros official app tile").props.style,
    ).aspectRatio,
  ).toBe(1);
  view.rerender(<LibrosLogo variant="compact" width={64} />);
  const mark = view.getByLabelText("Libros open book mark");
  expect(StyleSheet.flatten(mark.props.style).aspectRatio).toBe(890 / 650);
  expect(mark.props.resizeMode).toBe("contain");
});
