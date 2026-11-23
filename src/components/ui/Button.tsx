import {
  ActivityIndicator,
  Pressable,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { useThemeColors } from "@/theme/ThemeProvider";
import { Text } from "./Text";

export type ButtonVariant = "primary" | "secondary" | "destructive";

export type ButtonProps = PressableProps & {
  title: string;
  loading?: boolean;
  variant?: ButtonVariant;
  style?: StyleProp<ViewStyle>;
};

export function Button({
  title,
  loading = false,
  disabled,
  variant = "primary",
  style,
  ...props
}: ButtonProps) {
  const colors = useThemeColors();
  const isDisabled = Boolean(disabled || loading);

  // Figma 5:14: 48px height, rounded-md (12px), px-4 py-2
  return (
    <Pressable
      {...props}
      accessibilityRole="button"
      accessibilityLabel={props.accessibilityLabel ?? title}
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      testID={props.testID}
      disabled={isDisabled}
      className={`h-12 min-h-12 items-center justify-center rounded-md px-4 py-2 ${
        isDisabled
          ? "bg-surfaceAlt border border-border"
          : variant === "primary"
            ? "bg-primary active:bg-primaryHover"
            : variant === "destructive"
              ? "bg-negative active:bg-negativeHover"
              : "border border-border bg-surface active:bg-surfaceAlt"
      }`}
      style={style}
    >
      {loading ? (
        <ActivityIndicator
          accessibilityLabel="Loading"
          color={
            isDisabled
              ? colors.tertiary
              : variant === "secondary"
                ? colors.primary
                : colors.primaryOn
          }
        />
      ) : (
        <Text
          variant="Label"
          style={{
            color: isDisabled
              ? colors.tertiary
              : variant === "secondary"
                ? colors.text
                : colors.primaryOn,
          }}
        >
          {title}
        </Text>
      )}
    </Pressable>
  );
}
