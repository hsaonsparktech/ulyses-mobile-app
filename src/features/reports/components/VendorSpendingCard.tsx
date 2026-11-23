import { useState } from "react";
import { Pressable, View } from "react-native";
import { UtilityIcon } from "@/components/ui/Icon";
import { Text } from "@/components/ui/Text";

export interface VendorSpendingItem {
  vendor: string;
  category: string;
  amount: string;
}

export const sampleVendorSpending: VendorSpendingItem[] = [
  { vendor: "Metro Utilities", category: "Utilities", amount: "$342.00" },
  { vendor: "Cloud Platforms Inc", category: "Hosting", amount: "$185.00" },
  {
    vendor: "Oak Street Supply",
    category: "Office supplies",
    amount: "$128.40",
  },
  { vendor: "Office Depot", category: "Supplies", amount: "$89.00" },
];

// Figma 36:852 & 81:1303: Card / Vendor analysis
export function VendorSpendingCard() {
  const [expanded, setExpanded] = useState(false);
  const topVendor = sampleVendorSpending[0] ?? {
    vendor: "Metro Utilities",
    category: "Utilities",
    amount: "$342.00",
  };

  return (
    <View className="rounded-[16px] border border-border bg-surface overflow-hidden">
      {/* Top Vendor summary header (Figma 36:852) */}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Top vendor: ${topVendor.vendor}, ${topVendor.amount}. Tap to ${expanded ? "collapse" : "expand"} breakdown.`}
        onPress={() => setExpanded(!expanded)}
        className="p-4 active:bg-surfaceAlt"
      >
        <View className="flex-row items-center justify-between">
          <Text
            variant="Caption"
            tone="muted"
            className="uppercase tracking-wider"
          >
            TOP VENDOR THIS MONTH
          </Text>
          <View
            style={{ transform: [{ rotate: expanded ? "180deg" : "0deg" }] }}
          >
            <UtilityIcon name="chevron-down" size={16} />
          </View>
        </View>

        <View className="mt-1 flex-row items-center justify-between">
          <Text variant="Label" tone="text" className="font-semibold text-base">
            {topVendor.vendor}
          </Text>
          <Text variant="Label" tone="text" className="font-semibold text-base">
            {topVendor.amount}
          </Text>
        </View>
      </Pressable>

      {/* Expanded vendor breakdown list (Figma 81:1303) */}
      {expanded ? (
        <View className="border-t border-border bg-surfaceAlt/30 p-3 gap-2">
          <Text
            variant="Caption"
            tone="muted"
            className="mb-1 font-semibold uppercase"
          >
            All Vendor Spending · Nov 2026
          </Text>
          {sampleVendorSpending.map((item) => (
            <View
              key={item.vendor}
              className="flex-row items-center justify-between py-1.5 border-b border-border/40"
            >
              <View>
                <Text variant="BodySmall" tone="text" className="font-medium">
                  {item.vendor}
                </Text>
                <Text variant="Caption" tone="muted">
                  {item.category}
                </Text>
              </View>
              <Text variant="BodySmall" tone="text" className="font-semibold">
                {item.amount}
              </Text>
            </View>
          ))}
        </View>
      ) : null}
    </View>
  );
}
