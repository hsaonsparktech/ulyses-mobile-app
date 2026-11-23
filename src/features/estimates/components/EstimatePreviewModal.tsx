import { Alert, Modal, ScrollView, View } from "react-native";
import { Button } from "@/components/ui/Button";
import { Text } from "@/components/ui/Text";
import { useInvoiceStore } from "@/features/invoices/store";
import { useEstimateStore } from "../store";
import type { Estimate } from "../types";

export interface EstimatePreviewModalProps {
  estimate: Estimate | null;
  businessName: string;
  visible: boolean;
  onClose: () => void;
  onOpenShare: (estimate: Estimate) => void;
  onConvertedToInvoice?: (invoiceId: string) => void;
}

export function EstimatePreviewModal({
  estimate,
  businessName,
  visible,
  onClose,
  onOpenShare,
  onConvertedToInvoice,
}: EstimatePreviewModalProps) {
  const addInvoice = useInvoiceStore((s) => s.addInvoice);
  const markConverted = useEstimateStore((s) => s.markConverted);

  if (!estimate) return null;

  // Extract initial for business avatar - Never substitute Libros logo
  const initial = (businessName || "A").charAt(0).toUpperCase();

  const handleDownloadPdf = () => {
    Alert.alert(
      "PDF Ready",
      `Estimate ${estimate.estimateNumber}.pdf generated. In a production build, this downloads or prints the estimate.`,
      [{ text: "OK" }],
    );
  };

  const handleConvertToInvoice = () => {
    Alert.alert(
      "Convert to Invoice",
      `Convert ${estimate.estimateNumber} into a new invoice draft for ${estimate.clientName}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Convert",
          onPress: () => {
            const newInvoice = addInvoice(estimate.businessId, {
              clientId: estimate.clientId,
              clientName: estimate.clientName,
              clientEmail: estimate.clientEmail,
              issueDate: "Nov 08, 2026",
              dueDate: "Nov 22, 2026",
              currency: estimate.currency,
              items: estimate.items.map((it) => ({
                description: it.description,
                quantity: it.quantity,
                unitPrice: it.unitPrice,
              })),
              tax: estimate.tax,
              status: "Draft",
            });
            markConverted(estimate.id, newInvoice.id);
            Alert.alert(
              "Invoice Created",
              `Invoice ${newInvoice.invoiceNumber} has been created from ${estimate.estimateNumber}.`,
              [
                {
                  text: "View Invoice",
                  onPress: () => {
                    onClose();
                    if (onConvertedToInvoice) {
                      onConvertedToInvoice(newInvoice.id);
                    }
                  },
                },
              ],
            );
          },
        },
      ],
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
              Estimate preview
            </Text>
            <Text variant="Caption" tone="muted" className="mt-1">
              {estimate.estimateNumber} · Quotation for {estimate.clientName}
            </Text>
          </View>

          {/* Printable Preview Card Figma 81:741 */}
          <View className="bg-surface border border-border rounded-[14px] p-5 mb-4 shadow-sm">
            {/* Top row with customer initial avatar, business name, and ESTIMATE pill */}
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
                  ESTIMATE
                </Text>
              </View>
            </View>

            <View className="h-0.5 bg-primary/20 mb-4" />

            {/* Estimate meta */}
            <View className="mb-3">
              <Text variant="Body" className="font-semibold text-text">
                {estimate.estimateNumber}
              </Text>
              <Text variant="Caption" tone="muted" className="mt-1">
                Bill to: {estimate.clientName}
              </Text>
              <Text variant="Caption" tone="muted" className="mt-0.5">
                Date: {estimate.date}
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
              {estimate.items.map((item) => (
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
                TOTAL {estimate.currency}
              </Text>
              <Text variant="Title" tone="primary" className="font-semibold">
                ${estimate.total.toFixed(2)}
              </Text>
            </View>

            <View className="bg-surfaceAlt px-3 py-1.5 rounded-md self-start">
              <Text variant="Caption" tone="muted">
                PDF Preview · {estimate.status}
              </Text>
            </View>
          </View>

          {/* Context note Figma 81:759 */}
          <View className="bg-surface border border-border rounded-md p-3.5 mb-6">
            <Text variant="Caption" tone="muted">
              Track and share estimates without payment collection. You can
              convert to an invoice whenever the customer approves.
            </Text>
          </View>

          {/* Action buttons Figma 201:943 */}
          <View className="gap-3">
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
                  title="Share estimate"
                  variant="primary"
                  onPress={() => {
                    onClose();
                    onOpenShare(estimate);
                  }}
                />
              </View>
            </View>

            <Button
              title="Convert to invoice"
              variant="secondary"
              onPress={handleConvertToInvoice}
            />
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}
