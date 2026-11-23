import { Pressable, View } from "react-native";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Text } from "@/components/ui/Text";
import type { Estimate } from "../types";

export interface EstimateCardProps {
  estimate: Estimate;
  onPress: () => void;
}

export function EstimateCard({ estimate, onPress }: EstimateCardProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Estimate ${estimate.estimateNumber}, ${estimate.clientName}, $${estimate.total.toFixed(0)}, ${estimate.status}`}
      onPress={onPress}
      className="bg-surface border border-border rounded-[14px] p-3.5"
    >
      <View className="flex-row items-center justify-between mb-1.5">
        <Text
          variant="Body"
          className="font-semibold text-text flex-1 mr-2"
          numberOfLines={1}
        >
          {estimate.estimateNumber} · {estimate.clientName}
        </Text>
        <Text variant="Body" className="font-semibold text-text">
          ${estimate.total.toFixed(0)}
        </Text>
      </View>
      <View className="flex-row items-center justify-between">
        <Text variant="Caption" tone="muted">
          {estimate.status} · {estimate.date}
        </Text>
        <StatusBadge status={estimate.status} />
      </View>
    </Pressable>
  );
}
