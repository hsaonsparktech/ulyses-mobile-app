import { useRouter } from "expo-router";
import { Pressable, View } from "react-native";
import { UtilityIcon } from "@/components/ui/Icon";
import { Text } from "@/components/ui/Text";

export interface QuickActionsRowProps {
  onScan?: () => void;
  onInvoice?: () => void;
  onReports?: () => void;
}

// Figma 199:1877: Quick actions / Responsive row (height 66px, rounded-[12px], border border-border, bg-surface)
export function QuickActionsRow({
  onScan,
  onInvoice,
  onReports,
}: QuickActionsRowProps) {
  const router = useRouter();

  const handleScan = onScan ?? (() => router.push("/owner/documents"));
  const handleInvoice = onInvoice ?? (() => router.push("/owner/invoices"));
  const handleReports = onReports ?? (() => router.push("/owner/reports"));

  return (
    <View className="gap-2.5">
      <Text variant="Section">Quick actions</Text>

      <View className="flex-row gap-3">
        {/* Scan Action */}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Scan document"
          onPress={handleScan}
          className="h-[66px] flex-1 justify-between rounded-[12px] border border-border bg-surface p-2.5 active:bg-surfaceAlt"
        >
          <View className="flex-row items-start justify-between">
            <Text variant="Label" tone="text">
              Scan
            </Text>
            <UtilityIcon name="scan" size={19} color="#2459D8" />
          </View>
          <Text variant="Caption" tone="muted">
            Document
          </Text>
        </Pressable>

        {/* Invoice Action */}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Create invoice"
          onPress={handleInvoice}
          className="h-[66px] flex-1 justify-between rounded-[12px] border border-border bg-surface p-2.5 active:bg-surfaceAlt"
        >
          <View className="flex-row items-start justify-between">
            <Text variant="Label" tone="text">
              Invoice
            </Text>
            <UtilityIcon name="invoice" size={19} color="#2459D8" />
          </View>
          <Text variant="Caption" tone="muted">
            New draft
          </Text>
        </Pressable>

        {/* Reports Action */}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="View reports"
          onPress={handleReports}
          className="h-[66px] flex-1 justify-between rounded-[12px] border border-border bg-surface p-2.5 active:bg-surfaceAlt"
        >
          <View className="flex-row items-start justify-between">
            <Text variant="Label" tone="text">
              Reports
            </Text>
            <UtilityIcon name="reports" size={19} color="#2459D8" />
          </View>
          <Text variant="Caption" tone="muted">
            See trends
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
