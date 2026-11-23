import { type StyleProp, View, type ViewStyle } from "react-native";
import { typographyStyle } from "@/theme/tokens";
import { Text } from "./Text";

export type MetricType = "Income" | "Expenses" | "Profit" | "Unpaid";

export type MetricCardProps = {
  metric: MetricType;
  value: string;
  period?: string;
  style?: StyleProp<ViewStyle>;
  className?: string;
};

// Figma 6:18: LB / Metric Card (height 122px, rounded-lg 16px, border border-border, px-[14px] pt-[17px] pb-[13px])
export function MetricCard({
  metric,
  value,
  period = "November · USD",
  style,
  className = "",
}: MetricCardProps) {
  return (
    <View
      accessibilityRole="summary"
      accessibilityLabel={`${metric}: ${value}, ${period}`}
      className={`h-[122px] flex-col justify-between rounded-lg border border-border bg-surface px-[14px] pb-[13px] pt-[17px] ${className}`}
      style={style}
    >
      <Text
        variant="Caption"
        tone="muted"
        style={typographyStyle("Caption")}
        className="uppercase tracking-wider"
      >
        {metric}
      </Text>
      <Text variant="Title" tone="text" style={typographyStyle("Title")}>
        {value}
      </Text>
      <Text
        variant="Caption"
        tone="tertiary"
        style={typographyStyle("Caption")}
      >
        {period}
      </Text>
    </View>
  );
}
