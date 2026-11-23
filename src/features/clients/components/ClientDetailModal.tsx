import { Modal, ScrollView, View } from "react-native";
import { Button } from "@/components/ui/Button";
import { Text } from "@/components/ui/Text";
import type { Client } from "../types";

export interface ClientDetailModalProps {
  client: Client | null;
  businessName: string;
  visible: boolean;
  onClose: () => void;
  onCreateInvoiceForClient?: (client: Client) => void;
}

export function ClientDetailModal({
  client,
  businessName,
  visible,
  onClose,
  onCreateInvoiceForClient,
}: ClientDetailModalProps) {
  if (!client) return null;

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
              Client profile
            </Text>
            <Text variant="Caption" tone="muted" className="mt-1">
              {client.name}
            </Text>
          </View>

          {/* Record summary card Figma 81:565 */}
          <View className="bg-surface border border-border rounded-[14px] p-4 mb-3">
            <Text variant="Caption" tone="muted">
              DETAILS
            </Text>
            <Text variant="Title" className="font-semibold text-text mt-2">
              {client.email}
            </Text>
            {client.phone ? (
              <Text variant="Caption" tone="muted" className="mt-1">
                {client.phone} · {client.billingAddress}
              </Text>
            ) : null}
          </View>

          {/* Invoices issued card Figma 81:568 */}
          <View className="bg-surface border border-border rounded-[14px] p-3.5 mb-3 flex-row justify-between items-center">
            <Text variant="Body" tone="muted">
              Invoices issued
            </Text>
            <Text variant="Body" className="font-semibold text-text">
              {client.invoicesCount}
            </Text>
          </View>

          {/* Outstanding card Figma 81:571 */}
          <View className="bg-surface border border-border rounded-[14px] p-3.5 mb-3 flex-row justify-between items-center">
            <Text variant="Body" tone="muted">
              Outstanding
            </Text>
            <Text
              variant="Body"
              className={
                client.outstandingAmount > 0
                  ? "font-semibold text-primary"
                  : "font-semibold text-text"
              }
            >
              ${client.outstandingAmount.toFixed(2)}
            </Text>
          </View>

          {/* Last activity card Figma 81:574 */}
          <View className="bg-surface border border-border rounded-[14px] p-3.5 mb-3 flex-row justify-between items-center">
            <Text variant="Body" tone="muted">
              Last activity
            </Text>
            <Text variant="Body" className="font-semibold text-text">
              {client.lastActivity}
            </Text>
          </View>

          {/* Business card Figma 81:577 */}
          <View className="bg-surface border border-border rounded-[14px] p-3.5 mb-3 flex-row justify-between items-center">
            <Text variant="Body" tone="muted">
              Business
            </Text>
            <Text variant="Body" className="font-semibold text-text">
              {businessName}
            </Text>
          </View>

          {/* Note card Figma 81:580 */}
          <View className="bg-surface border border-border rounded-md p-3.5 mt-2">
            <Text variant="Caption" tone="muted">
              Client records belong to the active business.
            </Text>
          </View>

          {/* Actions Figma 201:939 */}
          <View className="flex-row gap-3 mt-8">
            <View className="flex-1">
              <Button title="Close" variant="secondary" onPress={onClose} />
            </View>
            <View className="flex-1">
              <Button
                title="Create invoice"
                variant="primary"
                onPress={() => {
                  onClose();
                  if (onCreateInvoiceForClient) {
                    onCreateInvoiceForClient(client);
                  }
                }}
              />
            </View>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}
