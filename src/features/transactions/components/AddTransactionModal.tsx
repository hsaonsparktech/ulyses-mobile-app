import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { Modal, Pressable, ScrollView, View } from "react-native";
import { z } from "zod";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Text } from "@/components/ui/Text";
import { useBusinessStore } from "@/features/businesses/store";
import { useTransactionStore } from "../store";
import type { TransactionType } from "../types";

const addTxSchema = z.object({
  amount: z
    .string()
    .trim()
    .min(1, "Amount is required.")
    .refine((val) => !Number.isNaN(Number(val)) && Number(val) > 0, {
      message: "Enter a positive number.",
    }),
  merchant: z.string().trim().min(2, "Merchant or client name is required."),
  category: z.string().trim().min(2, "Category is required."),
});

type AddTxInput = z.infer<typeof addTxSchema>;

export interface AddTransactionModalProps {
  visible: boolean;
  initialType?: TransactionType;
  onClose: () => void;
}

export function AddTransactionModal({
  visible,
  initialType = "Expense",
  onClose,
}: AddTransactionModalProps) {
  const [txType, setTxType] = useState<TransactionType>(initialType);
  const { addTransaction } = useTransactionStore();
  const { activeBusinessId } = useBusinessStore();

  const form = useForm<AddTxInput>({
    resolver: zodResolver(addTxSchema),
    defaultValues: {
      amount: "",
      merchant: "",
      category: txType === "Income" ? "Client payment" : "Office supplies",
    },
  });

  const onSubmit = (data: AddTxInput) => {
    const num = Number(data.amount);
    const today = "Nov 17, 2026";
    addTransaction({
      businessId: activeBusinessId,
      type: txType,
      amount: num,
      merchant: data.merchant,
      category: data.category,
      date: today,
      categoryDate: `${data.category} · Nov 17`,
    });
    form.reset();
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
          <ScrollView showsVerticalScrollIndicator={false}>
            <View className="mb-4">
              <Text variant="Heading">
                {txType === "Income" ? "Add Income" : "Add Expense"}
              </Text>
              <Text variant="BodySmall" tone="muted">
                Record a new financial entry for this business
              </Text>
            </View>

            {/* Type selector */}
            <View className="mb-4 flex-row gap-2">
              {(["Income", "Expense"] as const).map((type) => (
                <View key={type} className="flex-1">
                  <Button
                    title={type}
                    variant={txType === type ? "primary" : "secondary"}
                    onPress={() => {
                      setTxType(type);
                      form.setValue(
                        "category",
                        type === "Income"
                          ? "Client payment"
                          : "Office supplies",
                      );
                    }}
                  />
                </View>
              ))}
            </View>

            <View className="gap-3">
              <Controller
                control={form.control}
                name="amount"
                render={({ field, fieldState }) => (
                  <Input
                    label="Amount ($)"
                    placeholder="0.00"
                    keyboardType="decimal-pad"
                    value={field.value}
                    onBlur={field.onBlur}
                    onChangeText={field.onChange}
                    error={fieldState.error?.message}
                  />
                )}
              />

              <Controller
                control={form.control}
                name="merchant"
                render={({ field, fieldState }) => (
                  <Input
                    label={
                      txType === "Income"
                        ? "Client / Source"
                        : "Vendor / Merchant"
                    }
                    placeholder={
                      txType === "Income"
                        ? "e.g. Acme Client"
                        : "e.g. Office Depot"
                    }
                    value={field.value}
                    onBlur={field.onBlur}
                    onChangeText={field.onChange}
                    error={fieldState.error?.message}
                  />
                )}
              />

              <Controller
                control={form.control}
                name="category"
                render={({ field, fieldState }) => (
                  <Input
                    label="Category"
                    placeholder="e.g. Office supplies"
                    value={field.value}
                    onBlur={field.onBlur}
                    onChangeText={field.onChange}
                    error={fieldState.error?.message}
                  />
                )}
              />

              <View className="gap-2 pt-3">
                <Button
                  title={txType === "Income" ? "Save Income" : "Save Expense"}
                  variant="primary"
                  onPress={form.handleSubmit(onSubmit)}
                />
                <Button title="Cancel" variant="secondary" onPress={onClose} />
              </View>
            </View>
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
