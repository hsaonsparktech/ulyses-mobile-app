import { Text, View } from "react-native";

export interface BadgeProps {
  label?: string;
  children?: React.ReactNode;
  variant?: "primary" | "success" | "warning" | "danger" | "default";
  size?: "sm" | "md";
}

export function Badge({
  label,
  children,
  variant = "default",
  size = "sm",
}: BadgeProps) {
  const getVariantStyles = () => {
    switch (variant) {
      case "primary":
        return "bg-brand-primary/10 border-brand-primary/20";
      case "success":
        return "bg-feedback-success/10 border-feedback-success/20";
      case "warning":
        return "bg-feedback-warning/10 border-feedback-warning/20";
      case "danger":
        return "bg-feedback-danger/10 border-feedback-danger/20";
      default:
        return "bg-surface-secondary border-border-subtle";
    }
  };

  const getTextColor = () => {
    switch (variant) {
      case "primary":
        return "#1570EF";
      case "success":
        return "#059669";
      case "warning":
        return "#D97706";
      case "danger":
        return "#EF4444";
      default:
        return "#4B5563";
    }
  };

  return (
    <View
      className={`rounded-full border items-center justify-center ${
        size === "sm" ? "px-2 py-0.5" : "px-3 py-1"
      } ${getVariantStyles()}`}
    >
      {label ? (
        <Text
          style={{ color: getTextColor() }}
          className={`font-semibold ${size === "sm" ? "text-[10px]" : "text-xs"}`}
        >
          {label}
        </Text>
      ) : typeof children === "string" ? (
        <Text
          style={{ color: getTextColor() }}
          className={`font-semibold ${size === "sm" ? "text-[10px]" : "text-xs"}`}
        >
          {children}
        </Text>
      ) : (
        children
      )}
    </View>
  );
}
