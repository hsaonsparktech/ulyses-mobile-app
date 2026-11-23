import { Modal, View } from "react-native";
import { Button } from "@/components/ui/Button";
import { Text } from "@/components/ui/Text";
import type { Invoice } from "../types";

export interface PaymentConfirmModalProps {
  invoice: Invoice | null;
  visible: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export function PaymentConfirmModal({
  invoice,
  visible,
  onClose,
  onConfirm,
}: PaymentConfirmModalProps) {
  if (!invoice) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-black/50 items-center justify-center px-4">
        <View className="bg-surface border border-border rounded-xl p-5 w-full max-w-sm">
          <Text variant="Title" className="font-semibold text-text mb-4">
            Mark invoice as paid?
          </Text>

          <View className="bg-surfaceAlt rounded-md p-3 mb-4 gap-1.5">
            <Text variant="Body" className="font-medium text-text">
              Invoice {invoice.invoiceNumber}
            </Text>
            <Text variant="Caption" tone="primary" className="font-medium">
              ${invoice.total.toFixed(2)} received outside Libros
            </Text>
          </View>

          <Text variant="Caption" tone="muted" className="mb-6">
            Only confirm after receiving payment externally. This will update
            the status to Paid and record the settlement.
          </Text>

          <View className="flex-row gap-3">
            <View className="flex-1">
              <Button title="Cancel" variant="secondary" onPress={onClose} />
            </View>
            <View className="flex-1">
              <Button
                title="Confirm paid"
                variant="primary"
                onPress={onConfirm}
              />
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}
