import { Alert, Modal, ScrollView, View } from "react-native";
import { Button } from "@/components/ui/Button";
import { Text } from "@/components/ui/Text";
import type { Invoice } from "../types";

export interface InvoicePreviewModalProps {
  invoice: Invoice | null;
  businessName: string;
  visible: boolean;
  onClose: () => void;
  onOpenSend: (invoice: Invoice) => void;
}

export function InvoicePreviewModal({
  invoice,
  businessName,
  visible,
  onClose,
  onOpenSend,
}: InvoicePreviewModalProps) {
  if (!invoice) return null;

  // Extract initial for business avatar - Never substitute Libros logo
  const initial = (businessName || "A").charAt(0).toUpperCase();

  const handleDownloadPdf = () => {
    Alert.alert(
      "PDF Ready",
      `Invoice ${invoice.invoiceNumber}.pdf generated. In a production build, this downloads or prints the invoice.`,
      [{ text: "OK" }],
    );
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
              Invoice preview
            </Text>
            <Text variant="Caption" tone="muted" className="mt-1">
              {invoice.invoiceNumber} · {businessName}
            </Text>
          </View>

          {/* Printable Preview Card Figma 81:653 */}
          <View className="bg-surface border border-border rounded-[14px] p-5 mb-4 shadow-sm">
            {/* Top row with customer initial avatar, business name, and INVOICE pill */}
            <View className="flex-row items-center justify-between mb-4">
              <View className="flex-row items-center">
                {/* Brand Protection: Preserves customer-uploaded business logo/initials */}
                <View
                  accessibilityRole="image"
                  accessibilityLabel={`Business logo initial ${initial}`}
                  className="w-9 h-9 rounded-md bg-primary items-center justify-center mr-3"
                >
                  <Text variant="Body" className="font-semibold text-white">
                    {initial}
                  </Text>
                </View>
                <Text variant="Body" className="font-semibold text-text">
                  {businessName}
                </Text>
              </View>
              <View className="bg-surfaceAlt px-2.5 py-1 rounded-sm">
                <Text
                  variant="Caption"
                  tone="muted"
                  className="font-semibold uppercase"
                >
                  INVOICE
                </Text>
              </View>
            </View>

            <View className="h-0.5 bg-primary/20 mb-4" />

            {/* Invoice meta */}
            <View className="mb-3">
              <Text variant="Body" className="font-semibold text-text">
                {invoice.invoiceNumber}
              </Text>
              <Text variant="Caption" tone="muted" className="mt-1">
                Bill to: {invoice.clientName}
              </Text>
              <Text variant="Caption" tone="muted" className="mt-0.5">
                Issue: {invoice.issueDate} · Due: {invoice.dueDate}
              </Text>
            </View>

            <View className="h-px bg-border my-3" />

            {/* Table headers */}
            <View className="flex-row justify-between mb-2">
              <Text variant="Caption" tone="muted" className="font-semibold">
                SERVICE
              </Text>
              <Text variant="Caption" tone="muted" className="font-semibold">
                AMOUNT
              </Text>
            </View>

            {/* Line items list */}
            <View className="gap-2.5 my-2">
              {invoice.items.map((item) => (
                <View
                  key={item.id}
                  className="flex-row justify-between items-center"
                >
                  <View className="flex-1 mr-2">
                    <Text variant="Body" className="text-text">
                      {item.description}
                    </Text>
                    {item.quantity > 1 ? (
                      <Text variant="Caption" tone="muted">
                        {item.quantity} × ${item.unitPrice.toFixed(2)}
                      </Text>
                    ) : null}
                  </View>
                  <Text variant="Body" className="font-medium text-text">
                    ${item.amount.toFixed(2)}
                  </Text>
                </View>
              ))}
            </View>

            <View className="h-px bg-border my-3" />

            {/* Totals */}
            <View className="flex-row justify-between items-center mb-4">
              <Text variant="Body" className="font-semibold text-text">
                TOTAL {invoice.currency}
              </Text>
              <Text variant="Title" tone="primary" className="font-semibold">
                ${invoice.total.toFixed(2)}
              </Text>
            </View>

            <View className="bg-surfaceAlt px-3 py-1.5 rounded-md self-start">
              <Text variant="Caption" tone="muted">
                PDF Preview · {invoice.deliveryStatus ?? "Not sent"}
              </Text>
            </View>
          </View>

          {/* Payment Note Figma 81:671 */}
          <View className="bg-surface border border-border rounded-md p-3.5 mb-6">
            <Text variant="Caption" tone="muted">
              Payment is tracked manually after receipt. Libros does not act as
              an automated payment intermediary.
            </Text>
          </View>

          {/* Action buttons Figma 201:941 */}
          <View className="flex-row gap-3">
            <View className="flex-1">
              <Button
                title="Download PDF"
                variant="secondary"
                onPress={handleDownloadPdf}
              />
            </View>
            <View className="flex-1">
              <Button
                title="Send invoice"
                variant="primary"
                onPress={() => {
                  onClose();
                  onOpenSend(invoice);
                }}
              />
            </View>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}
