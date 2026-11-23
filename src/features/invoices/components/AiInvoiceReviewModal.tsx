import { Modal, ScrollView, View } from "react-native";
import { Button } from "@/components/ui/Button";
import { Text } from "@/components/ui/Text";

export interface AiInvoiceDraftData {
  clientName: string;
  clientEmail: string;
  prompt: string;
  items: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
  }>;
}

export interface AiInvoiceReviewModalProps {
  visible: boolean;
  draftData: AiInvoiceDraftData;
  onClose: () => void;
  onApplyDraft: (data: AiInvoiceDraftData) => void;
}

export function AiInvoiceReviewModal({
  visible,
  draftData,
  onClose,
  onApplyDraft,
}: AiInvoiceReviewModalProps) {
  const total = draftData.items.reduce(
    (sum, item) => sum + item.quantity * item.unitPrice,
    0,
  );

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
          <View className="mb-6">
            <Text variant="Title" className="font-semibold text-text">
              AI invoice draft
            </Text>
            <Text variant="Caption" tone="muted" className="mt-1">
              Generate from approved business data
            </Text>
          </View>

          {/* Prompt card Figma 36:716 */}
          <View className="bg-surface border border-border rounded-[14px] p-4 mb-4">
            <Text variant="Caption" tone="muted">
              DRAFT REQUEST
            </Text>
            <Text variant="Body" className="font-medium text-text mt-2">
              {draftData.prompt}
            </Text>
          </View>

          {/* Suggested line items card Figma 36:720 */}
          <View className="bg-surface border border-border rounded-[14px] p-4 mb-4">
            <Text variant="Caption" tone="warning" className="font-medium">
              AI DRAFT · REVIEW REQUIRED
            </Text>
            <View className="mt-3 gap-2.5">
              {draftData.items.map((item) => (
                <View
                  key={item.description}
                  className="flex-row justify-between items-center"
                >
                  <Text variant="Body" className="text-text flex-1 mr-2">
                    {item.description} ({item.quantity} × ${item.unitPrice})
                  </Text>
                  <Text variant="Body" className="font-semibold text-text">
                    ${(item.quantity * item.unitPrice).toFixed(2)}
                  </Text>
                </View>
              ))}
            </View>
            <View className="h-px bg-border my-3" />
            <View className="flex-row justify-between items-center">
              <Text variant="Body" tone="muted" className="font-medium">
                Draft total
              </Text>
              <Text variant="Title" tone="primary" className="font-semibold">
                ${total.toFixed(2)}
              </Text>
            </View>
          </View>

          {/* User confirmation notice card Figma 36:727 */}
          <View className="bg-surface border border-border rounded-[14px] p-4 mb-6">
            <Text variant="Body" className="font-semibold text-text">
              Confirm all details
            </Text>
            <Text
              variant="Caption"
              tone="muted"
              className="mt-2 leading-relaxed"
            >
              AI drafts may contain incorrect clients, prices or dates. No
              auto-sending occurs until you review and explicitly submit the
              invoice.
            </Text>
          </View>

          {/* Action buttons */}
          <View className="flex-row gap-3">
            <View className="flex-1">
              <Button title="Cancel" variant="secondary" onPress={onClose} />
            </View>
            <View className="flex-1">
              <Button
                title="Review invoice"
                variant="primary"
                onPress={() => {
                  onApplyDraft(draftData);
                  onClose();
                }}
              />
            </View>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}
