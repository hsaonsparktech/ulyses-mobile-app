import { useState } from "react";
import { Modal, ScrollView, View } from "react-native";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Text } from "@/components/ui/Text";
import { useInvoiceStore } from "../store";
import type { Invoice } from "../types";
import { PaymentConfirmModal } from "./PaymentConfirmModal";

export interface InvoiceDetailModalProps {
  invoice: Invoice | null;
  visible: boolean;
  onClose: () => void;
  onPreview?: (invoice: Invoice) => void;
}

export function InvoiceDetailModal({
  invoice,
  visible,
  onClose,
  onPreview,
}: InvoiceDetailModalProps) {
  const [showConfirmPayment, setShowConfirmPayment] = useState(false);
  const markAsPaid = useInvoiceStore((s) => s.markAsPaid);

  if (!invoice) return null;

  const handleConfirmPaid = () => {
    markAsPaid(invoice.id);
    setShowConfirmPayment(false);
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-canvas">
        <ScrollView
          className="flex-1 px-4 pt-6"
          contentContainerStyle={{ paddingBottom: 40 }}
        >
          {/* Header */}
          <View className="mb-4">
            <Text variant="Title" className="font-semibold text-text">
              Invoice {invoice.invoiceNumber}
            </Text>
            <Text variant="Caption" tone="muted" className="mt-1">
              {invoice.clientName} · {invoice.currency}
            </Text>
          </View>

          {/* Invoice status card Figma 36:757 */}
          <View className="bg-surface border border-border rounded-[14px] p-4 mb-4">
            <View className="flex-row justify-between items-start mb-2">
              <Text variant="Caption" tone="muted">
                INVOICE TOTAL
              </Text>
              <StatusBadge status={invoice.status} />
            </View>
            <Text
              variant="Display"
              className="font-semibold text-text mt-1 text-[28px]"
            >
              ${invoice.total.toFixed(2)}
            </Text>
          </View>

          {/* Invoice information card Figma 36:761 */}
          <View className="bg-surface border border-border rounded-[14px] p-4 mb-4 gap-3">
            <View className="flex-row justify-between items-center">
              <Text variant="Body" tone="muted">
                Bill to
              </Text>
              <Text variant="Body" className="font-medium text-text">
                {invoice.clientName}
              </Text>
            </View>

            <View className="flex-row justify-between items-center">
              <Text variant="Body" tone="muted">
                Issue date
              </Text>
              <Text variant="Body" className="font-medium text-text">
                {invoice.issueDate}
              </Text>
            </View>

            <View className="flex-row justify-between items-center">
              <Text variant="Body" tone="muted">
                Due date
              </Text>
              <Text variant="Body" className="font-medium text-text">
                {invoice.dueDate}
              </Text>
            </View>

            <View className="flex-row justify-between items-center">
              <Text variant="Body" tone="muted">
                Invoice method
              </Text>
              <Text variant="Body" className="font-medium text-text">
                Email / PDF
              </Text>
            </View>
          </View>

          {/* Line summary card Figma 36:770 */}
          <View className="bg-surface border border-border rounded-[14px] p-4 mb-4">
            <Text variant="Caption" tone="muted" className="font-semibold mb-3">
              LINE ITEMS
            </Text>
            <View className="gap-2.5">
              {invoice.items.map((item) => (
                <View
                  key={item.id}
                  className="flex-row justify-between items-center"
                >
                  <Text variant="Body" className="text-text flex-1 mr-2">
                    {item.description}
                  </Text>
                  <Text variant="Body" className="font-semibold text-text">
                    ${item.amount.toFixed(0)}
                  </Text>
                </View>
              ))}
            </View>
          </View>

          {/* Manual payment reminder card Figma 36:776 */}
          <View className="bg-surface border border-border rounded-md p-3.5 mb-6">
            <Text variant="Body" className="font-semibold text-text">
              No online payment collection
            </Text>
            <Text variant="Caption" tone="muted" className="mt-1">
              Record payment after receiving it externally via ACH, check, or
              wire.
            </Text>
          </View>

          {/* Action buttons */}
          <View className="gap-3">
            {invoice.status !== "Paid" ? (
              <Button
                title="Mark as paid"
                variant="primary"
                onPress={() => setShowConfirmPayment(true)}
              />
            ) : null}

            <View className="flex-row gap-3">
              <View className="flex-1">
                <Button title="Close" variant="secondary" onPress={onClose} />
              </View>
              {onPreview ? (
                <View className="flex-1">
                  <Button
                    title="Preview PDF"
                    variant="secondary"
                    onPress={() => {
                      onClose();
                      onPreview(invoice);
                    }}
                  />
                </View>
              ) : null}
            </View>
          </View>
        </ScrollView>
      </View>

      <PaymentConfirmModal
        invoice={invoice}
        visible={showConfirmPayment}
        onClose={() => setShowConfirmPayment(false)}
        onConfirm={handleConfirmPaid}
      />
    </Modal>
  );
}
