import { useState } from "react";
import { TextInput, type TextInputProps, View } from "react-native";
import { useThemeColors } from "@/theme/ThemeProvider";
import { typographyStyle } from "@/theme/tokens";
import { Text } from "./Text";

export type InputProps = TextInputProps & {
  label: string;
  error?: string;
};

export function Input({
  label,
  error,
  style,
  onFocus,
  onBlur,
  ...props
}: InputProps) {
  const colors = useThemeColors();
  const [isFocused, setIsFocused] = useState(false);

  const handleFocus: TextInputProps["onFocus"] = (e) => {
    setIsFocused(true);
    onFocus?.(e);
  };

  const handleBlur: TextInputProps["onBlur"] = (e) => {
    setIsFocused(false);
    onBlur?.(e);
  };

  // Figma 5:38: 51px height, rounded-md (12px), px-[13px]
  const borderClasses = error
    ? "border-2 border-negative"
    : isFocused
      ? "border-2 border-focus"
      : "border border-border";

  return (
    <View className="gap-2">
      <Text variant="Label">{label}</Text>
      <TextInput
        {...props}
        accessibilityLabel={label}
        aria-invalid={Boolean(error)}
        placeholderTextColor={colors.tertiary}
        selectionColor={colors.focus}
        onFocus={handleFocus}
        onBlur={handleBlur}
        className={`h-[51px] rounded-md bg-surface px-[13px] text-text ${borderClasses}`}
        style={[typographyStyle("BodySmall"), style]}
      />
      {error ? (
        <Text variant="BodySmall" tone="negative" accessibilityRole="alert">
          {error}
        </Text>
      ) : null}
    </View>
  );
}
