import { useState } from "react";
import { Modal, Pressable, ScrollView, View } from "react-native";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { FeedbackIcon, UtilityIcon } from "@/components/ui/Icon";
import { Text } from "@/components/ui/Text";
import { useTransactionStore } from "../store";
import type { Transaction } from "../types";

export interface TransactionDetailModalProps {
  transaction: Transaction | null;
  visible: boolean;
  onClose: () => void;
}

export function TransactionDetailModal({
  transaction,
  visible,
  onClose,
}: TransactionDetailModalProps) {
  const { archiveTransaction } = useTransactionStore();
  const [confirmArchive, setConfirmArchive] = useState(false);

  if (!transaction) return null;

  const handleArchive = () => {
    archiveTransaction(transaction.id);
    setConfirmArchive(false);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable className="flex-1 justify-end bg-black/50" onPress={onClose}>
        <Pressable
          className="max-h-[90%] rounded-t-[24px] border-t border-border bg-surface p-6 shadow-xl"
          onPress={(e) => e.stopPropagation()}
        >
          {confirmArchive ? (
            /* Archive confirmation view (Figma 89:552) */
            <View className="items-center gap-4 py-4">
              <View className="size-16 items-center justify-center rounded-full bg-negativeSoft">
                <FeedbackIcon variant="warning" size={32} />
              </View>

              <Text variant="Section" className="text-center">
                Archive transaction?
              </Text>

              <Text variant="BodySmall" tone="muted" className="text-center">
                Are you sure you want to archive this{" "}
                {transaction.formattedAmount} transaction for{" "}
                {transaction.merchant}? It will be excluded from regular
                activity metrics.
              </Text>

              <View className="w-full gap-2 pt-4">
                <Button
                  title="Confirm archive"
                  variant="destructive"
                  onPress={handleArchive}
                />
                <Button
                  title="Cancel"
                  variant="secondary"
                  onPress={() => setConfirmArchive(false)}
                />
              </View>
            </View>
          ) : (
            /* Transaction detail view (Figma 81:498) */
            <ScrollView showsVerticalScrollIndicator={false}>
              <View className="mb-4 flex-row items-center justify-between">
                <View>
                  <Text variant="Heading">Transaction details</Text>
                  <Text variant="BodySmall" tone="muted">
                    {transaction.type} · {transaction.merchant}
                  </Text>
                </View>

                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Close"
                  hitSlop={8}
                  onPress={onClose}
                  className="rounded-full bg-surfaceAlt p-2"
                >
                  <UtilityIcon name="chevron-down" size={16} />
                </Pressable>
              </View>

              <View className="gap-3">
                {/* Details / Amount Card (81:521) */}
                <Card>
                  <View className="gap-1">
                    <Text
                      variant="Caption"
                      tone="muted"
                      className="uppercase tracking-wider"
                    >
                      DETAILS
                    </Text>
                    <Text
                      variant="Section"
                      tone={transaction.type === "Income" ? "positive" : "text"}
                      className="font-bold text-2xl"
                    >
                      {transaction.formattedAmount}
                    </Text>
                  </View>
                </Card>

                {/* Vendor Row (81:524) */}
                <Card>
                  <View className="flex-row items-center justify-between py-1">
                    <Text variant="Caption" tone="muted">
                      Vendor / Merchant
                    </Text>
                    <Text variant="Label" tone="text">
                      {transaction.merchant}
                    </Text>
                  </View>
                </Card>

                {/* Date Row (81:527) */}
                <Card>
                  <View className="flex-row items-center justify-between py-1">
                    <Text variant="Caption" tone="muted">
                      Date
                    </Text>
                    <Text variant="Label" tone="text">
                      {transaction.date}
                    </Text>
                  </View>
                </Card>

                {/* Category Row (81:530) */}
                <Card>
                  <View className="flex-row items-center justify-between py-1">
                    <Text variant="Caption" tone="muted">
                      Category
                    </Text>
                    <Text variant="Label" tone="text">
                      {transaction.category}
                    </Text>
                  </View>
                </Card>

                {/* Receipt Row (81:533) */}
                <Card>
                  <View className="flex-row items-center justify-between py-1">
                    <Text variant="Caption" tone="muted">
                      Receipt
                    </Text>
                    <Text
                      variant="Label"
                      tone={transaction.receiptFile ? "primary" : "muted"}
                    >
                      {transaction.receiptFile ?? "No receipt attached"}
                    </Text>
                  </View>
                </Card>

                {/* Note Card (81:536) */}
                <View className="rounded-md border border-border bg-surfaceAlt p-3">
                  <Text variant="Caption" tone="muted">
                    Deleting or archiving financial records requires
                    confirmation.
                  </Text>
                </View>

                {/* Actions (201:938) */}
                <View className="gap-2 pt-2">
                  <Button
                    title="Archive transaction"
                    variant="destructive"
                    onPress={() => setConfirmArchive(true)}
                  />
                  <Button title="Close" variant="secondary" onPress={onClose} />
                </View>
              </View>
            </ScrollView>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}
