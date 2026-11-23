import { useState } from "react";
import { Pressable, View } from "react-native";
import { Screen } from "@/components/layout/Screen";
import { BusinessSwitcher } from "@/components/ui/BusinessSwitcher";
import { Button } from "@/components/ui/Button";
import { UtilityIcon } from "@/components/ui/Icon";
import { LibrosLogo } from "@/components/ui/LibrosLogo";
import { MetricCard } from "@/components/ui/MetricCard";
import { Text } from "@/components/ui/Text";
import { BusinessSwitcherModal } from "@/features/businesses/components/BusinessSwitcherModal";
import { useBusinessStore } from "@/features/businesses/store";
import { MonthlyBarChart } from "../components/MonthlyBarChart";
import { NumericMonthlyTable } from "../components/NumericMonthlyTable";
import { ReportExportModal } from "../components/ReportExportModal";
import { VendorSpendingCard } from "../components/VendorSpendingCard";

export function OwnerReportsScreen() {
  const { activeBusiness } = useBusinessStore();
  const currentBiz = activeBusiness();

  const [switcherVisible, setSwitcherVisible] = useState(false);
  const [activeChip, setActiveChip] = useState<
    "Nov 2026" | "P&L report" | "Vendors"
  >("Nov 2026");
  const [showTable, setShowTable] = useState(false);
  const [exportVisible, setExportVisible] = useState(false);

  return (
    <Screen>
      <View className="gap-5 pb-6">
        {/* Workspace Header: compact mark + Libros + notification bell */}
        <View className="flex-row items-center justify-between pt-1">
          <View className="flex-row items-center gap-2.5">
            <LibrosLogo variant="compact" width={22} height={15.98} />
            <Text variant="Title" tone="text">
              Libros
            </Text>
          </View>
          <View className="size-[38px] items-center justify-center rounded-[12px] border border-border bg-surface">
            <UtilityIcon name="bell" size={20} color="#2459D8" />
          </View>
        </View>

        {/* Business Switcher (Figma 6:48) */}
        <BusinessSwitcher
          business={currentBiz.name}
          onPress={() => setSwitcherVisible(true)}
        />

        {/* Screen Title & Subtitle */}
        <View className="gap-1">
          <Text variant="Heading">Financial reports</Text>
          <Text variant="BodySmall" tone="muted">
            Understand your business at a glance
          </Text>
        </View>

        {/* Period Chips (Figma 36:818 - 36:822) */}
        <View className="flex-row gap-2">
          {(["Nov 2026", "P&L report", "Vendors"] as const).map((chip) => {
            const isSelected = activeChip === chip;
            return (
              <Pressable
                key={chip}
                accessibilityRole="button"
                accessibilityLabel={`View: ${chip}`}
                onPress={() => setActiveChip(chip)}
                className={`h-[34px] flex-1 items-center justify-center rounded-full border ${
                  isSelected
                    ? "border-primary bg-primarySoft"
                    : "border-border bg-surface active:bg-surfaceAlt"
                }`}
              >
                <Text
                  variant="Caption"
                  tone={isSelected ? "primary" : "muted"}
                  className="font-medium"
                >
                  {chip}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* Net Profit Card (Figma 36:824) */}
        <View className="h-[94px] rounded-[16px] border border-border bg-surface p-3.5 justify-between">
          <Text
            variant="Caption"
            tone="muted"
            className="uppercase tracking-wider"
          >
            NET PROFIT / NOVEMBER
          </Text>
          <View className="flex-row items-baseline justify-between">
            <Text
              variant="Amount"
              tone="text"
              className="font-bold text-[30px]"
            >
              $8,230.00
            </Text>
            <Text variant="Caption" tone="muted">
              Income less expenses
            </Text>
          </View>
        </View>

        {/* Metric Cards Row */}
        <View className="flex-row gap-2.5">
          <View className="flex-1">
            <MetricCard
              metric="Income"
              value="$12,480"
              period={`November · ${currentBiz.currency}`}
            />
          </View>
          <View className="flex-1">
            <MetricCard
              metric="Expenses"
              value="$4,250"
              period={`November · ${currentBiz.currency}`}
            />
          </View>
        </View>

        {/* 6-Month Income vs Expenses Bar Chart (Figma 36:830) */}
        <MonthlyBarChart
          tableVisible={showTable}
          onToggleTable={() => setShowTable(!showTable)}
        />

        {/* Accessible Numeric Monthly Table (Figma 224:942) */}
        {showTable ? <NumericMonthlyTable /> : null}

        {/* Top Vendor Card & Breakdown (Figma 36:852 & 81:1303) */}
        <VendorSpendingCard />

        {/* Export Actions (Figma 201:934) */}
        <View className="flex-row gap-3 pt-2">
          <View className="flex-1">
            <Button
              title="Export PDF"
              variant="primary"
              onPress={() => setExportVisible(true)}
            />
          </View>
          <View className="flex-1">
            <Button
              title="Export CSV"
              variant="secondary"
              onPress={() => setExportVisible(true)}
            />
          </View>
        </View>
      </View>

      {/* Modals */}
      <BusinessSwitcherModal
        visible={switcherVisible}
        onClose={() => setSwitcherVisible(false)}
      />

      <ReportExportModal
        visible={exportVisible}
        businessName={currentBiz.name}
        onClose={() => setExportVisible(false)}
      />
    </Screen>
  );
}
