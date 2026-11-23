import { useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, View } from "react-native";
import { Screen } from "@/components/layout/Screen";
import { BusinessSwitcher } from "@/components/ui/BusinessSwitcher";
import { UtilityIcon } from "@/components/ui/Icon";
import { LibrosLogo } from "@/components/ui/LibrosLogo";
import { MetricCard } from "@/components/ui/MetricCard";
import { SvgIcon } from "@/components/ui/SvgIcon";
import { Text } from "@/components/ui/Text";
import { TransactionRow } from "@/components/ui/TransactionRow";
import { BusinessSwitcherModal } from "@/features/businesses/components/BusinessSwitcherModal";
import { useBusinessStore } from "@/features/businesses/store";
import { DocumentCalendarModal } from "@/features/documents/components/DocumentCalendarModal";
import { useDocumentStore } from "@/features/documents/store";
import { NotificationsModal } from "@/features/notifications/components/NotificationsModal";
import { SettingsModal } from "@/features/settings/components/SettingsModal";
import { TransactionDetailModal } from "@/features/transactions/components/TransactionDetailModal";
import { useTransactionStore } from "@/features/transactions/store";
import type { Transaction } from "@/features/transactions/types";
import { EstimatedProfitCard } from "../components/EstimatedProfitCard";
import { QuickActionsRow } from "../components/QuickActionsRow";

export function OwnerDashboardScreen() {
  const router = useRouter();
  const { activeBusiness } = useBusinessStore();
  const currentBiz = activeBusiness();

  const { transactions } = useTransactionStore();
  const documents = useDocumentStore((s) => s.documents);

  const [switcherVisible, setSwitcherVisible] = useState(false);
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);
  const [notificationsVisible, setNotificationsVisible] = useState(false);
  const [settingsVisible, setSettingsVisible] = useState(false);
  const [calendarVisible, setCalendarVisible] = useState(false);

  // Filter transactions for this business
  const bizTransactions = transactions.filter(
    (tx) => tx.businessId === currentBiz.id && !tx.archived,
  );

  const totalIncome = bizTransactions
    .filter((tx) => tx.type === "Income")
    .reduce((sum, tx) => sum + tx.amount, 0);

  const totalExpense = bizTransactions
    .filter((tx) => tx.type === "Expense")
    .reduce((sum, tx) => sum + tx.amount, 0);

  const netProfit = totalIncome - totalExpense;

  const formattedProfit = `$${netProfit.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

  const formattedIncome = `$${totalIncome.toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`;

  const formattedExpense = `$${totalExpense.toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`;

  const recentTransactions = bizTransactions.slice(0, 3);

  return (
    <Screen>
      <View className="gap-5 pb-6">
        {/* Workspace Header: compact mark + Libros + notification bell + settings */}
        <View className="flex-row items-center justify-between pt-1">
          <View className="flex-row items-center gap-2.5">
            <LibrosLogo variant="compact" width={22} height={15.98} />
            <Text variant="Title" tone="text">
              Libros
            </Text>
          </View>
          <View className="flex-row items-center gap-2">
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Notifications"
              onPress={() => setNotificationsVisible(true)}
              className="size-[38px] items-center justify-center rounded-[12px] border border-border bg-surface active:bg-surfaceAlt"
            >
              <UtilityIcon name="bell" size={20} color="#2459D8" />
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Business settings"
              onPress={() => setSettingsVisible(true)}
              className="size-[38px] items-center justify-center rounded-[12px] border border-border bg-surface active:bg-surfaceAlt"
            >
              <SvgIcon name="settings" size={18} color="#2459D8" />
            </Pressable>
          </View>
        </View>

        {/* Business Switcher (Figma 6:48) */}
        <BusinessSwitcher
          business={currentBiz.name}
          onPress={() => setSwitcherVisible(true)}
        />

        {/* Period & Financial overview header with Calendar shortcut (318:1210) */}
        <View className="flex-row items-center justify-between">
          <View className="gap-0.5">
            <Text variant="Title">Financial overview</Text>
            <Text variant="Caption" tone="muted">
              November 2026 · {currentBiz.currency}
            </Text>
          </View>

          {/* Calendar shortcut (Figma 318:1210: 48px height >=44px) */}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Calendar period filter"
            onPress={() => setCalendarVisible(true)}
            className="h-[44px] flex-row items-center gap-2 rounded-[10px] border border-border bg-surface px-3 active:bg-surfaceAlt"
          >
            <View className="h-[18px] w-[16px] rounded-[3px] border border-primary bg-surface p-0.5 justify-between">
              <View className="h-1 rounded-[1px] bg-primary" />
              <View className="flex-row justify-around">
                <View className="size-1 rounded-full bg-primary" />
                <View className="size-1 rounded-full bg-primary" />
              </View>
            </View>
            <Text variant="Label" tone="primary">
              Calendar
            </Text>
          </Pressable>
        </View>

        {/* Hero / Estimated Profit Card (Figma 36:528) */}
        <EstimatedProfitCard amount={formattedProfit} />

        {/* Responsive Metrics Row (Figma 199:1876) */}
        <View className="flex-row gap-2.5">
          <View className="flex-1">
            <MetricCard
              metric="Income"
              value={formattedIncome}
              period={`November · ${currentBiz.currency}`}
            />
          </View>
          <View className="flex-1">
            <MetricCard
              metric="Expenses"
              value={formattedExpense}
              period={`November · ${currentBiz.currency}`}
            />
          </View>
        </View>

        {/* Quick Actions (Figma 199:1877) */}
        <QuickActionsRow
          onScan={() => router.push("/owner/documents")}
          onInvoice={() => router.push("/owner/invoices")}
          onReports={() => router.push("/owner/reports")}
        />

        {/* Recent Activity (Figma 36:544) */}
        <View className="gap-3">
          <View className="flex-row items-center justify-between">
            <Text variant="Section">Recent activity</Text>
            <Pressable
              accessibilityRole="link"
              accessibilityLabel="See all activity"
              hitSlop={8}
              onPress={() => router.push("/owner/activity")}
            >
              <Text variant="Label" tone="primary">
                See all →
              </Text>
            </Pressable>
          </View>

          {recentTransactions.map((tx) => (
            <TransactionRow
              key={tx.id}
              type={tx.type}
              amount={tx.formattedAmount}
              merchant={tx.merchant}
              categoryDate={tx.categoryDate}
              onPress={() => setSelectedTx(tx)}
            />
          ))}
        </View>
      </View>

      {/* Modals */}
      <BusinessSwitcherModal
        visible={switcherVisible}
        onClose={() => setSwitcherVisible(false)}
      />

      <TransactionDetailModal
        transaction={selectedTx}
        visible={Boolean(selectedTx)}
        onClose={() => setSelectedTx(null)}
      />

      {notificationsVisible && (
        <NotificationsModal
          visible={notificationsVisible}
          onClose={() => setNotificationsVisible(false)}
        />
      )}

      {settingsVisible && (
        <SettingsModal
          visible={settingsVisible}
          onClose={() => setSettingsVisible(false)}
        />
      )}

      {calendarVisible && (
        <DocumentCalendarModal
          documents={documents.filter((d) => !d.archived)}
          visible={calendarVisible}
          onClose={() => setCalendarVisible(false)}
          onSelectDocument={() => {
            setCalendarVisible(false);
            router.push("/owner/documents");
          }}
        />
      )}
    </Screen>
  );
}
