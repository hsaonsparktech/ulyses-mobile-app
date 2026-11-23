import { Text as NativeText, type TextProps } from "react-native";
import { useThemeColors } from "@/theme/ThemeProvider";
import {
  type SemanticName,
  type TypographyName,
  typographyStyle,
} from "@/theme/tokens";

type Props = TextProps & { variant?: TypographyName; tone?: SemanticName };
export function Text({
  className = "",
  variant = "Body",
  tone = "text",
  style,
  ...props
}: Props) {
  const colors = useThemeColors();
  return (
    <NativeText
      {...props}
      className={className}
      style={[typographyStyle(variant), { color: colors[tone] }, style]}
    />
  );
}
