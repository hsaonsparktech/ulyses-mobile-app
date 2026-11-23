import { type StyleProp, View, type ViewStyle } from "react-native";
import { type SemanticName, typographyStyle } from "@/theme/tokens";
import { Text } from "./Text";

export type BadgeStatus =
  | "Paid"
  | "Unpaid"
  | "Overdue"
  | "Draft"
  | "AI Review"
  | "Sent"
  | "Accepted"
  | "Declined";

export type StatusBadgeProps = {
  status: BadgeStatus;
  label?: string;
  style?: StyleProp<ViewStyle>;
  className?: string;
};

const statusConfig: Record<
  BadgeStatus,
  { bgClass: string; tone: SemanticName }
> = {
  Paid: { bgClass: "bg-positiveSoft", tone: "positive" },
  Unpaid: { bgClass: "bg-primarySoft", tone: "primary" },
  Overdue: { bgClass: "bg-negativeSoft", tone: "negative" },
  Draft: { bgClass: "bg-surfaceAlt", tone: "muted" },
  "AI Review": { bgClass: "bg-warningSoft", tone: "warning" },
  Sent: { bgClass: "bg-primarySoft", tone: "primary" },
  Accepted: { bgClass: "bg-positiveSoft", tone: "positive" },
  Declined: { bgClass: "bg-negativeSoft", tone: "negative" },
};

// Figma 5:25: LB / Status Badge (height 32px, rounded-pill 999px, px-4 py-2)
export function StatusBadge({
  status,
  label = status,
  style,
  className = "",
}: StatusBadgeProps) {
  const config = statusConfig[status] ?? statusConfig.Draft;

  return (
    <View
      accessibilityRole="text"
      accessibilityLabel={`Status: ${label}`}
      className={`h-8 items-center justify-center rounded-pill px-4 py-2 ${config.bgClass} ${className}`}
      style={style}
    >
      <Text
        variant="Caption"
        tone={config.tone}
        style={typographyStyle("Caption")}
      >
        {label}
      </Text>
    </View>
  );
}
