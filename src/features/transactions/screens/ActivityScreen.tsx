import { useState } from "react";
import { Pressable, View } from "react-native";
import { EmptyState } from "@/components/feedback/Feedback";
import { Screen } from "@/components/layout/Screen";
import { BusinessSwitcher } from "@/components/ui/BusinessSwitcher";
import { Button } from "@/components/ui/Button";
import { UtilityIcon } from "@/components/ui/Icon";
import { LibrosLogo } from "@/components/ui/LibrosLogo";
import { Text } from "@/components/ui/Text";
import { TransactionRow } from "@/components/ui/TransactionRow";
import { BusinessSwitcherModal } from "@/features/businesses/components/BusinessSwitcherModal";
import { useBusinessStore } from "@/features/businesses/store";
import { AddTransactionModal } from "../components/AddTransactionModal";
import { TransactionDetailModal } from "../components/TransactionDetailModal";
import { useTransactionStore } from "../store";
import type { Transaction, TransactionType } from "../types";

export function ActivityScreen() {
  const { activeBusiness } = useBusinessStore();
  const currentBiz = activeBusiness();

  const { transactions } = useTransactionStore();

  const [switcherVisible, setSwitcherVisible] = useState(false);
  const [filter, setFilter] = useState<"All" | "Income" | "Expense">("All");
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [addType, setAddType] = useState<TransactionType>("Expense");

  // Filter transactions by active business, archive status, and filter tab
  const bizTransactions = transactions.filter(
    (tx) => tx.businessId === currentBiz.id && !tx.archived,
  );

  const filteredTransactions = bizTransactions.filter((tx) => {
    if (filter === "All") return true;
    return tx.type === filter;
  });

  // Calculate totals
  const totalIncome = bizTransactions
    .filter((tx) => tx.type === "Income")
    .reduce((sum, tx) => sum + tx.amount, 0);

  const totalExpense = bizTransactions
    .filter((tx) => tx.type === "Expense")
    .reduce((sum, tx) => sum + tx.amount, 0);

  const formattedIncome = `$${totalIncome.toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;

  const formattedExpense = `$${totalExpense.toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;

  const handleOpenAdd = (type: TransactionType) => {
    setAddType(type);
    setAddModalVisible(true);
  };

  return (
    <Screen>
      <View className="gap-5 pb-6">
        {/* Workspace Header: compact mark + Libros + notifications */}
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
          <Text variant="Heading">Activity</Text>
          <Text variant="BodySmall" tone="muted">
            Income and expenses for this business
          </Text>
        </View>

        {/* Activity Summary Card (Figma 36:1009) */}
        <View className="h-[112px] rounded-[16px] border border-border bg-surface p-4 justify-between">
          <Text
            variant="Caption"
            tone="muted"
            className="uppercase tracking-wider"
          >
            THIS MONTH
          </Text>
          <View className="flex-row items-center justify-between">
            <View>
              <Text
                variant="Title"
                tone="positive"
                className="font-semibold text-[22px]"
              >
                {formattedIncome}
              </Text>
              <Text variant="Caption" tone="muted">
                Income
              </Text>
            </View>
            <View>
              <Text
                variant="Title"
                tone="text"
                className="font-semibold text-[22px]"
              >
                {formattedExpense}
              </Text>
              <Text variant="Caption" tone="muted">
                Expenses
              </Text>
            </View>
          </View>
        </View>

        {/* Filter Chips (Figma 36:1015 - 36:1019) */}
        <View className="flex-row gap-2">
          {(["All", "Income", "Expense"] as const).map((tab) => {
            const isSelected = filter === tab;
            const label = tab === "Expense" ? "Expenses" : tab;
            return (
              <Pressable
                key={tab}
                accessibilityRole="button"
                accessibilityLabel={`Filter: ${label}`}
                onPress={() => setFilter(tab)}
                className={`h-[38px] flex-1 items-center justify-center rounded-[11px] border ${
                  isSelected
                    ? "border-primary bg-primarySoft"
                    : "border-border bg-surface active:bg-surfaceAlt"
                }`}
              >
                <Text
                  variant="Label"
                  tone={isSelected ? "primary" : "muted"}
                  className="font-normal"
                >
                  {label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* Recent Transactions List */}
        <View className="gap-3">
          <Text variant="Section">Recent transactions</Text>

          {filteredTransactions.length === 0 ? (
            <EmptyState
              title="No transactions"
              message={`No ${filter !== "All" ? filter.toLowerCase() : ""} transactions found for ${currentBiz.name}.`}
              actionTitle="+ Add expense"
              onAction={() => handleOpenAdd("Expense")}
            />
          ) : (
            filteredTransactions.map((tx) => (
              <TransactionRow
                key={tx.id}
                type={tx.type}
                amount={tx.formattedAmount}
                merchant={tx.merchant}
                categoryDate={tx.categoryDate}
                onPress={() => setSelectedTx(tx)}
              />
            ))
          )}
        </View>

        {/* Action Buttons: + Income & + Expense (Figma 201:933) */}
        <View className="flex-row gap-3 pt-2">
          <View className="flex-1">
            <Button
              title="+ Income"
              variant="primary"
              onPress={() => handleOpenAdd("Income")}
            />
          </View>
          <View className="flex-1">
            <Button
              title="+ Expense"
              variant="primary"
              onPress={() => handleOpenAdd("Expense")}
            />
          </View>
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

      <AddTransactionModal
        visible={addModalVisible}
        initialType={addType}
        onClose={() => setAddModalVisible(false)}
      />
    </Screen>
  );
}
