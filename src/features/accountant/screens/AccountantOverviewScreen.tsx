import { useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { Badge } from "@/components/ui/Badge";
import { LibrosLogo } from "@/components/ui/LibrosLogo";
import { SvgIcon } from "@/components/ui/SvgIcon";
import { ReportExportModal } from "../components/ReportExportModal";
import { useAccountantStore } from "../store";

export function AccountantOverviewScreen() {
  const router = useRouter();
  const metrics = useAccountantStore((s) => s.metrics);
  const [exportModalVisible, setExportModalVisible] = useState(false);

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
        contentContainerStyle={{ paddingBottom: 60 }}
      >
        {/* Title */}
        <View className="mb-5">
          <Text className="text-2xl font-bold text-content-primary">
            Overview
          </Text>
          <Text className="text-xs text-content-secondary mt-0.5">
            Figma Frame 41:294 · Accountant Overview
          </Text>
        </View>

        {/* Business-Scoped Access Card Figma 41:300 */}
        <View className="bg-surface-secondary rounded-2xl p-4 border border-border-subtle mb-6">
          <View className="flex-row items-center justify-between mb-2">
            <View className="flex-row items-center space-x-2">
              <View className="w-7 h-7 rounded-full bg-brand-primary/10 items-center justify-center">
                <SvgIcon name="shield" size={15} color="#1570EF" />
              </View>
              <Text className="text-xs font-bold text-content-secondary uppercase tracking-wider">
                BUSINESS-SCOPED ACCESS
              </Text>
            </View>
            <Badge variant="primary" size="sm" label="Read-Only" />
          </View>

          <Text className="text-lg font-bold text-content-primary mb-1">
            {metrics.clientName}
          </Text>
          <Text className="text-xs text-content-secondary">
            {metrics.scopeDescription}
          </Text>
        </View>

        {/* Income / Expense Metrics Figma 41:304 & 41:307 */}
        <View className="flex-row space-x-3 mb-4">
          {/* Income Cell */}
          <View className="flex-1 bg-surface-secondary rounded-2xl p-4 border border-border-subtle">
            <Text className="text-xs font-bold text-content-secondary uppercase tracking-wider mb-1">
              TOTAL INCOME
            </Text>
            <Text className="text-xl font-bold text-content-primary">
              ${metrics.totalIncome.toLocaleString()}
            </Text>
            <Text className="text-[11px] font-semibold text-emerald-600 mt-1">
              {metrics.incomeTrend}
            </Text>
          </View>

          {/* Expense Cell */}
          <View className="flex-1 bg-surface-secondary rounded-2xl p-4 border border-border-subtle">
            <Text className="text-xs font-bold text-content-secondary uppercase tracking-wider mb-1">
              TOTAL EXPENSES
            </Text>
            <Text className="text-xl font-bold text-content-primary">
              ${metrics.totalExpenses.toLocaleString()}
            </Text>
            <Text className="text-[11px] font-semibold text-emerald-600 mt-1">
              {metrics.expenseTrend}
            </Text>
          </View>
        </View>

        {/* Estimated Profit Hero Card Figma 41:310 */}
        <View className="bg-surface-secondary rounded-2xl p-5 border border-border-subtle mb-6">
          <View className="flex-row items-center justify-between mb-2">
            <Text className="text-xs font-bold text-content-secondary uppercase tracking-wider">
              ESTIMATED NET PROFIT
            </Text>
            <Badge
              variant="success"
              size="sm"
              label={`Margin ${metrics.profitMargin}`}
            />
          </View>

          <Text className="text-3xl font-bold text-content-primary mb-1">
            ${metrics.netProfit.toLocaleString()}.00
          </Text>
          <Text className="text-xs text-content-secondary">
            Reconciled through {metrics.reconciledThrough}
          </Text>
        </View>

        {/* Financial Reports Shortcut Card Figma 41:314 */}
        <Text className="text-base font-bold text-content-primary mb-3">
          Accounting shortcuts
        </Text>

        <View className="bg-surface-secondary rounded-2xl p-4 border border-border-subtle mb-6">
          <Pressable
            onPress={() => router.navigate("/accountant/reports")}
            className="flex-row items-center justify-between pb-3.5 border-b border-border-subtle active:opacity-70"
            accessibilityLabel="Financial reports"
          >
            <View className="flex-1 pr-3">
              <Text className="text-sm font-bold text-content-primary">
                Financial reports & trends
              </Text>
              <Text className="text-xs text-content-secondary mt-0.5">
                P&L statements, monthly revenue charts & vendor metrics
              </Text>
            </View>
            <View className="w-9 h-9 rounded-xl bg-brand-primary/10 items-center justify-center">
              <SvgIcon name="dollar-sign" size={18} color="#1570EF" />
            </View>
          </Pressable>

          <Pressable
            onPress={() => setExportModalVisible(true)}
            className="pt-3.5 flex-row items-center justify-between active:opacity-70"
            accessibilityLabel="Export client package"
          >
            <View className="flex-1 pr-3">
              <Text className="text-sm font-bold text-content-primary">
                Export client report
              </Text>
              <Text className="text-xs text-content-secondary mt-0.5">
                Generate formatted PDF or spreadsheet audit package
              </Text>
            </View>
            <View className="w-9 h-9 rounded-xl bg-brand-primary/10 items-center justify-center">
              <SvgIcon name="file-text" size={18} color="#1570EF" />
            </View>
          </Pressable>
        </View>
      </ScrollView>

      {/* Export Report Modal */}
      <ReportExportModal
        visible={exportModalVisible}
        onClose={() => setExportModalVisible(false)}
      />
    </View>
  );
}
