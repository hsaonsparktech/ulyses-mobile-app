import { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { LibrosLogo } from "@/components/ui/LibrosLogo";
import { SvgIcon } from "@/components/ui/SvgIcon";
import { ReportExportModal } from "../components/ReportExportModal";
import { VendorSpendingModal } from "../components/VendorSpendingModal";
import { useAccountantStore } from "../store";

export function AccountantReportsScreen() {
  const pnl = useAccountantStore((s) => s.pnl);
  const monthlyData = useAccountantStore((s) => s.monthlyData);
  const vendorSpending = useAccountantStore((s) => s.vendorSpending);
  const selectedPeriod = useAccountantStore((s) => s.selectedPeriod);
  const setSelectedPeriod = useAccountantStore((s) => s.setSelectedPeriod);

  const [showNumericTable, setShowNumericTable] = useState(false);
  const [exportModalVisible, setExportModalVisible] = useState(false);
  const [vendorModalVisible, setVendorModalVisible] = useState(false);

  const periods = ["Q3 2026", "YTD", "Last 6 Mo"];

  // Normalize monthly values for chart scaling (max income is ~50,000)
  const maxVal = 50000;

  return (
    <View className="flex-1 bg-surface-primary">
      {/* Header Bar */}
      <View className="px-6 pt-12 pb-4 bg-surface-primary border-b border-border-subtle">
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center space-x-2.5">
            <LibrosLogo variant="compact" width={22} height={15.98} />
            <Text className="text-xl font-bold text-content-primary">
              Libros
            </Text>
          </View>

          {/* Role Badge Figma 166:71 */}
          <View className="flex-row items-center bg-brand-primary/10 px-3 py-1.5 rounded-full space-x-1.5 border border-brand-primary/20">
            <SvgIcon name="dollar-sign" size={14} color="#1570EF" />
            <Text className="text-xs font-bold text-brand-primary tracking-wider">
              ACCOUNTANT
            </Text>
          </View>
        </View>
      </View>

      <ScrollView
        className="flex-1 px-6 py-5"
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {/* Title & Actions */}
        <View className="flex-row items-center justify-between mb-4">
          <View>
            <Text className="text-2xl font-bold text-content-primary">
              Financial Reports
            </Text>
            <Text className="text-xs text-content-secondary mt-0.5">
              Figma Frame 41:324 · Reports & Statements
            </Text>
          </View>
          <Button
            variant="primary"
            onPress={() => setExportModalVisible(true)}
            title="Export"
          />
        </View>

        {/* Period Selector */}
        <View className="flex-row space-x-2 mb-5">
          {periods.map((p) => {
            const isSelected = selectedPeriod === p;
            return (
              <Pressable
                key={p}
                onPress={() => setSelectedPeriod(p)}
                className={`flex-1 py-2 px-3 rounded-xl border items-center ${
                  isSelected
                    ? "bg-brand-primary border-brand-primary"
                    : "bg-surface-secondary border-border-subtle"
                }`}
                accessibilityLabel={`Period ${p}`}
              >
                <Text
                  className={`text-xs font-semibold ${
                    isSelected ? "text-white" : "text-content-secondary"
                  }`}
                >
                  {p}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* Profit & Loss Card Figma 41:330 & 84:144 */}
        <View className="bg-surface-secondary rounded-2xl p-5 border border-border-subtle mb-6">
          <View className="flex-row items-center justify-between mb-4">
            <View>
              <Text className="text-base font-bold text-content-primary">
                Profit & Loss Statement
              </Text>
              <Text className="text-xs text-content-secondary">
                {pnl.period}
              </Text>
            </View>
            <Badge variant="success" size="sm" label="Audited" />
          </View>

          <View className="space-y-2.5">
            <View className="flex-row justify-between py-1 border-b border-border-subtle/40">
              <Text className="text-sm text-content-secondary">
                Gross Revenue
              </Text>
              <Text className="text-sm font-semibold text-content-primary">
                ${pnl.grossRevenue.toLocaleString()}
              </Text>
            </View>

            <View className="flex-row justify-between py-1 border-b border-border-subtle/40">
              <Text className="text-sm text-content-secondary">
                Cost of Goods Sold (COGS)
              </Text>
              <Text className="text-sm font-semibold text-content-primary">
                -${pnl.costOfGoodsSold.toLocaleString()}
              </Text>
            </View>

            <View className="flex-row justify-between py-1.5 border-b border-border-subtle">
              <Text className="text-sm font-bold text-content-primary">
                Gross Profit
              </Text>
              <Text className="text-sm font-bold text-emerald-600">
                ${pnl.grossProfit.toLocaleString()}
              </Text>
            </View>

            <View className="flex-row justify-between py-1 border-b border-border-subtle/40">
              <Text className="text-sm text-content-secondary">
                Operating Expenses
              </Text>
              <Text className="text-sm font-semibold text-content-primary">
                -${pnl.operatingExpenses.toLocaleString()}
              </Text>
            </View>

            <View className="flex-row justify-between py-1 border-b border-border-subtle/40">
              <Text className="text-sm text-content-secondary">
                Tax & Depreciation
              </Text>
              <Text className="text-sm font-semibold text-content-primary">
                -${pnl.taxDepreciation.toLocaleString()}
              </Text>
            </View>

            <View className="flex-row justify-between pt-2">
              <Text className="text-base font-bold text-content-primary">
                Net Income
              </Text>
              <Text className="text-base font-bold text-brand-primary">
                ${pnl.netIncome.toLocaleString()}
              </Text>
            </View>
          </View>
        </View>

        {/* 6-Month Trend Chart Figma 41:334 */}
        <View className="bg-surface-secondary rounded-2xl p-5 border border-border-subtle mb-6">
          <View className="flex-row items-center justify-between mb-4">
            <View>
              <Text className="text-base font-bold text-content-primary">
                6-Month Financial Trend
              </Text>
              <Text className="text-xs text-content-secondary">
                Income vs Expenses (May – Oct 2026)
              </Text>
            </View>
            <View className="flex-row items-center space-x-3">
              <View className="flex-row items-center space-x-1">
                <View className="w-2.5 h-2.5 rounded-full bg-brand-primary" />
                <Text className="text-[10px] text-content-secondary">
                  Income
                </Text>
              </View>
              <View className="flex-row items-center space-x-1">
                <View className="w-2.5 h-2.5 rounded-full bg-gray-400" />
                <Text className="text-[10px] text-content-secondary">
                  Expenses
                </Text>
              </View>
            </View>
          </View>

          {/* Bar Chart Visualization */}
          <View className="h-40 flex-row items-end justify-between pt-4 pb-2 border-b border-border-subtle">
            {monthlyData.map((item) => {
              const incomeHeight = Math.max(
                12,
                Math.round((item.income / maxVal) * 120),
              );
              const expenseHeight = Math.max(
                12,
                Math.round((item.expenses / maxVal) * 120),
              );

              return (
                <View key={item.month} className="items-center flex-1 px-1">
                  <View className="flex-row items-end space-x-1 justify-center">
                    {/* Income bar */}
                    <View
                      className="w-3 bg-brand-primary rounded-t-sm"
                      style={{ height: incomeHeight }}
                    />
                    {/* Expense bar */}
                    <View
                      className="w-3 bg-gray-400 rounded-t-sm"
                      style={{ height: expenseHeight }}
                    />
                  </View>
                  <Text className="text-[10px] font-semibold text-content-secondary mt-2">
                    {item.month}
                  </Text>
                </View>
              );
            })}
          </View>

          {/* Numeric Monthly Table Toggle Figma 224:1271 */}
          <Pressable
            onPress={() => setShowNumericTable(!showNumericTable)}
            className="pt-3.5 flex-row items-center justify-between"
            accessibilityLabel="Toggle numeric table"
          >
            <Text className="text-xs font-bold text-brand-primary">
              {showNumericTable
                ? "Hide numeric breakdown table"
                : "Show numeric breakdown table"}
            </Text>
            <SvgIcon
              name={showNumericTable ? "chevron-up" : "chevron-down"}
              size={14}
              color="#1570EF"
            />
          </Pressable>

          {/* Accessible Numeric Table Figma 224:1271 */}
          {showNumericTable && (
            <View className="mt-4 pt-3 border-t border-border-subtle">
              <View className="flex-row justify-between pb-2 border-b border-border-subtle">
                <Text className="text-xs font-bold text-content-secondary flex-1">
                  Month
                </Text>
                <Text className="text-xs font-bold text-content-secondary flex-1 text-right">
                  Income
                </Text>
                <Text className="text-xs font-bold text-content-secondary flex-1 text-right">
                  Expenses
                </Text>
                <Text className="text-xs font-bold text-content-secondary flex-1 text-right">
                  Net
                </Text>
              </View>

              {monthlyData.map((row) => (
                <View
                  key={row.month}
                  className="flex-row justify-between py-2 border-b border-border-subtle/30"
                >
                  <Text className="text-xs font-semibold text-content-primary flex-1">
                    {row.month}
                  </Text>
                  <Text className="text-xs text-content-primary flex-1 text-right">
                    ${row.income.toLocaleString()}
                  </Text>
                  <Text className="text-xs text-content-secondary flex-1 text-right">
                    ${row.expenses.toLocaleString()}
                  </Text>
                  <Text className="text-xs font-bold text-emerald-600 flex-1 text-right">
                    ${row.net.toLocaleString()}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Top Vendor Spending Card Figma 41:354 */}
        <View className="bg-surface-secondary rounded-2xl p-5 border border-border-subtle mb-6">
          <View className="flex-row items-center justify-between mb-3">
            <View>
              <Text className="text-base font-bold text-content-primary">
                Top Vendor Spending
              </Text>
              <Text className="text-xs text-content-secondary">
                Largest expense allocations this period
              </Text>
            </View>
            <Badge variant="primary" size="sm" label="Top 4" />
          </View>

          <View className="space-y-3 mb-4">
            {vendorSpending.slice(0, 4).map((vendor) => (
              <View key={vendor.id}>
                <View className="flex-row justify-between items-baseline mb-1">
                  <Text className="text-sm font-semibold text-content-primary">
                    {vendor.name}
                  </Text>
                  <Text className="text-xs font-bold text-content-primary">
                    ${vendor.amount.toLocaleString()} ({vendor.percentage})
                  </Text>
                </View>
                <View
                  className="w-full bg-gray-200 rounded-full overflow-hidden"
                  style={{ height: 6 }}
                >
                  <View
                    className="bg-brand-primary rounded-full"
                    style={{
                      height: 6,
                      width: `${Number.parseInt(vendor.percentage, 10)}%`,
                    }}
                  />
                </View>
              </View>
            ))}
          </View>

          <Button
            variant="secondary"
            onPress={() => setVendorModalVisible(true)}
            title="View All Vendor Spending"
          />
        </View>
      </ScrollView>

      {/* Export Report Modal */}
      <ReportExportModal
        visible={exportModalVisible}
        onClose={() => setExportModalVisible(false)}
      />

      {/* Vendor Spending Modal */}
      <VendorSpendingModal
        visible={vendorModalVisible}
        onClose={() => setVendorModalVisible(false)}
      />
    </View>
  );
}
