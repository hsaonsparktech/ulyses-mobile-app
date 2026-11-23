import { Pressable, View } from "react-native";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Text } from "@/components/ui/Text";
import type { Invoice } from "../types";

export interface InvoiceCardProps {
  invoice: Invoice;
  onPress: () => void;
}

export function InvoiceCard({ invoice, onPress }: InvoiceCardProps) {
  const dateLabel =
    invoice.status === "Paid" && invoice.paidDate
      ? `${invoice.issueDate} · Paid ${invoice.paidDate}`
      : `${invoice.issueDate} · Due ${invoice.dueDate}`;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Invoice ${invoice.invoiceNumber}, ${invoice.clientName}, $${invoice.total.toFixed(0)}, ${invoice.status}`}
      onPress={onPress}
      className="bg-surface border border-border rounded-[14px] p-3.5"
    >
      <View className="flex-row items-center justify-between mb-1.5">
        <Text
          variant="Body"
          className="font-semibold text-text flex-1 mr-2"
          numberOfLines={1}
        >
          {invoice.invoiceNumber} · {invoice.clientName}
        </Text>
        <Text variant="Body" className="font-semibold text-text">
          ${invoice.total.toFixed(0)}
        </Text>
      </View>
      <View className="flex-row items-center justify-between">
        <Text variant="Caption" tone="muted">
          {dateLabel}
        </Text>
        <StatusBadge status={invoice.status} />
      </View>
    </Pressable>
  );
}
