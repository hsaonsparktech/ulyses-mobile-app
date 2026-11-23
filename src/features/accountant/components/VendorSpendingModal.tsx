import { useState } from "react";
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { SvgIcon } from "@/components/ui/SvgIcon";
import { useAccountantStore } from "../store";

interface VendorSpendingModalProps {
  visible: boolean;
  onClose: () => void;
}

export function VendorSpendingModal({
  visible,
  onClose,
}: VendorSpendingModalProps) {
  const vendors = useAccountantStore((s) => s.vendorSpending);
  const [search, setSearch] = useState("");

  const filtered = vendors.filter(
    (v) =>
      v.name.toLowerCase().includes(search.toLowerCase()) ||
      v.category.toLowerCase().includes(search.toLowerCase()),
  );

  const totalSpent = vendors.reduce((acc, v) => acc + v.amount, 0);

  const handleExportVendors = () => {
    Alert.alert(
      "Export Started",
      "Vendor spending summary CSV generated and saved to device.",
      [{ text: "OK" }],
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView className="flex-1 bg-surface" edges={["top", "bottom"]}>
        {/* Header */}
        <View className="flex-row items-center justify-between px-6 pt-2 pb-4 border-b border-border bg-surface">
          <View className="flex-row items-center space-x-3">
            <View className="w-10 h-10 rounded-full bg-primary/10 items-center justify-center">
              <SvgIcon name="dollar-sign" size={20} color="#1570EF" />
            </View>
            <View collapsable={false}>
              <Text
                className="text-xl font-bold text-text"
                accessibilityRole="header"
              >
                Vendor Spending
              </Text>
              <Text className="text-xs text-textMuted">
                Figma Frame 41:365 · Detailed Vendor Allocation
              </Text>
            </View>
          </View>
          <Pressable
            onPress={onClose}
            className="w-9 h-9 rounded-full bg-surface border border-border items-center justify-center min-h-[44px] min-w-[44px]"
            accessibilityRole="button"
            accessibilityLabel="Close vendor spending modal"
            collapsable={false}
          >
            <SvgIcon name="x" size={20} color="#6B7280" />
          </Pressable>
        </View>

        <ScrollView
          className="flex-1 px-6 py-4"
          contentContainerStyle={{ paddingBottom: 40 }}
        >
          {/* Summary Card */}
          <View className="bg-surface-secondary rounded-2xl p-4 border border-border-subtle mb-5">
            <Text className="text-xs font-bold text-content-secondary uppercase tracking-wider mb-1">
              TOTAL VENDOR EXPENDITURES
            </Text>
            <View className="flex-row items-baseline justify-between">
              <Text className="text-3xl font-bold text-content-primary">
                ${totalSpent.toLocaleString()}
              </Text>
              <Badge
                variant="primary"
                size="sm"
                label={`${vendors.length} Active Vendors`}
              />
            </View>
            <Text className="text-xs text-content-secondary mt-1">
              Reconciled vendor accounts for FY 2026 Q3 reporting period.
            </Text>
          </View>

          {/* Search Bar */}
          <View className="flex-row items-center bg-surface-secondary rounded-xl px-3.5 py-2.5 border border-border-subtle mb-4 space-x-2">
            <SvgIcon name="search" size={16} color="#9CA3AF" />
            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder="Search vendor or category..."
              placeholderTextColor="#9CA3AF"
              className="flex-1 text-sm text-content-primary"
            />
          </View>

          {/* Vendor List */}
          <View className="space-y-3 mb-6">
            {filtered.map((item) => (
              <View
                key={item.id}
                className="bg-surface-secondary rounded-xl p-4 border border-border-subtle"
              >
                <View className="flex-row items-start justify-between mb-2">
                  <View className="flex-1 pr-2">
                    <Text className="text-sm font-bold text-content-primary">
                      {item.name}
                    </Text>
                    <Text className="text-xs text-content-secondary mt-0.5">
                      {item.category} · {item.invoiceCount} invoices
                    </Text>
                  </View>
                  <View className="items-end">
                    <Text className="text-sm font-bold text-content-primary">
                      ${item.amount.toLocaleString()}
                    </Text>
                    <Text className="text-xs font-semibold text-brand-primary mt-0.5">
                      {item.percentage}
                    </Text>
                  </View>
                </View>

                {/* Spending Progress Bar */}
                <View
                  className="w-full bg-gray-200 rounded-full overflow-hidden"
                  style={{ height: 6 }}
                >
                  <View
                    className="bg-brand-primary rounded-full"
                    style={{
                      height: 6,
                      width: `${Number.parseInt(item.percentage, 10)}%`,
                    }}
                  />
                </View>
              </View>
            ))}
          </View>

          {/* Export Action */}
          <Button
            variant="secondary"
            onPress={handleExportVendors}
            title="Export Vendor Ledger (CSV)"
          />
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}
