import { useMemo, useState } from "react";
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  TextInput,
  View,
} from "react-native";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Text } from "@/components/ui/Text";
import { useClientStore } from "@/features/clients/store";
import type { Client } from "@/features/clients/types";
import { useInvoiceStore } from "../store";
import type { Invoice } from "../types";
import {
  type AiInvoiceDraftData,
  AiInvoiceReviewModal,
} from "./AiInvoiceReviewModal";

export interface CreateInvoiceModalProps {
  visible: boolean;
  businessId: string;
  initialClient?: Client | null;
  onClose: () => void;
  onInvoiceCreated: (invoice: Invoice) => void;
}

interface FormLineItem {
  id: string;
  description: string;
  quantity: string;
  unitPrice: string;
}

export function CreateInvoiceModal({
  visible,
  businessId,
  initialClient,
  onClose,
  onInvoiceCreated,
}: CreateInvoiceModalProps) {
  const allClients = useClientStore((s) => s.clients);
  const clients = useMemo(
    () => allClients.filter((c) => c.businessId === businessId),
    [allClients, businessId],
  );
  const addInvoice = useInvoiceStore((s) => s.addInvoice);

  const [selectedClient, setSelectedClient] = useState<Client | null>(
    initialClient ?? clients[0] ?? null,
  );
  const [showClientPicker, setShowClientPicker] = useState(false);
  const [issueDate, setIssueDate] = useState("Nov 08, 2026");
  const [dueDate, setDueDate] = useState("Nov 22, 2026");

  const [lineItems, setLineItems] = useState<FormLineItem[]>([
    {
      id: "inv-init-1",
      description: "Brand identity consultation",
      quantity: "1",
      unitPrice: "680",
    },
    {
      id: "inv-init-2",
      description: "Monthly bookkeeping",
      quantity: "2",
      unitPrice: "125",
    },
  ]);

  const [showAiModal, setShowAiModal] = useState(false);

  // Calculations
  const calculatedItems = lineItems.map((item) => {
    const qty = Number.parseFloat(item.quantity) || 0;
    const price = Number.parseFloat(item.unitPrice) || 0;
    return {
      description: item.description,
      quantity: qty,
      unitPrice: price,
      amount: qty * price,
    };
  });

  const subtotal = calculatedItems.reduce((acc, curr) => acc + curr.amount, 0);
  const tax = 0;
  const total = subtotal + tax;

  const handleAddLineItem = () => {
    setLineItems((prev) => [
      ...prev,
      {
        id: `inv-item-${Date.now()}`,
        description: "New service item",
        quantity: "1",
        unitPrice: "100",
      },
    ]);
  };

  const handleUpdateLineItem = (
    index: number,
    field: keyof Omit<FormLineItem, "id">,
    value: string,
  ) => {
    setLineItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item)),
    );
  };

  const handleRemoveLineItem = (index: number) => {
    if (lineItems.length <= 1) {
      Alert.alert("Notice", "An invoice must have at least one line item.");
      return;
    }
    setLineItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleAiDraftApply = (draft: AiInvoiceDraftData) => {
    const matching = clients.find((c) =>
      c.name.toLowerCase().includes(draft.clientName.toLowerCase()),
    );
    if (matching) setSelectedClient(matching);

    setLineItems(
      draft.items.map((it, idx) => ({
        id: `ai-item-${Date.now()}-${idx}`,
        description: it.description,
        quantity: it.quantity.toString(),
        unitPrice: it.unitPrice.toString(),
      })),
    );
  };

  const handleCreateAndPreview = () => {
    if (!selectedClient) {
      Alert.alert("Validation", "Please select a client for this invoice.");
      return;
    }
    if (lineItems.length === 0 || subtotal <= 0) {
      Alert.alert(
        "Validation",
        "Please add at least one line item with a price.",
      );
      return;
    }

    const created = addInvoice(businessId, {
      clientId: selectedClient.id,
      clientName: selectedClient.name,
      clientEmail: selectedClient.email,
      issueDate,
      dueDate,
      currency: "USD",
      items: calculatedItems.map((item) => ({
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
      })),
      tax,
      status: "Draft",
    });

    onClose();
    onInvoiceCreated(created);
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
          contentContainerStyle={{ paddingBottom: 50 }}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header Figma 36:629 */}
          <View className="flex-row justify-between items-start mb-4">
            <View>
              <Text variant="Title" className="font-semibold text-text">
                Create invoice
              </Text>
              <Text variant="Caption" tone="muted" className="mt-1">
                New draft · USD
              </Text>
            </View>
            <StatusBadge status="Draft" />
          </View>

          {/* Client Selector Card Figma 36:633 */}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Select client for invoice"
            onPress={() => setShowClientPicker(true)}
            className="bg-surface border border-border rounded-[14px] p-4 mb-4"
          >
            <Text variant="Caption" tone="muted">
              BILL TO
            </Text>
            <Text variant="Body" className="font-semibold text-text mt-1.5">
              {selectedClient?.name ?? "Select client..."}
            </Text>
            <Text variant="Caption" tone="muted" className="mt-0.5">
              {selectedClient?.email ?? "No client selected"}
            </Text>
          </Pressable>

          {/* Invoice Details Card Figma 36:639 */}
          <View className="bg-surface border border-border rounded-[14px] p-4 mb-4 gap-3">
            <View className="flex-row justify-between items-center">
              <View className="flex-1 mr-2">
                <Text variant="Caption" tone="muted">
                  Invoice #
                </Text>
                <Text variant="Body" className="font-medium text-text mt-1">
                  Auto-assigned
                </Text>
              </View>
            </View>

            <View className="h-px bg-border" />

            <View className="gap-3">
              <Input
                label="Issue date"
                value={issueDate}
                onChangeText={setIssueDate}
              />
              <Input
                label="Due date"
                value={dueDate}
                onChangeText={setDueDate}
              />
            </View>
          </View>

          {/* Line items card Figma 36:647 */}
          <View className="bg-surface border border-border rounded-[14px] p-4 mb-4">
            <View className="flex-row justify-between items-center mb-3">
              <Text variant="Caption" tone="muted" className="font-semibold">
                LINE ITEMS
              </Text>
              {/* Review with AI button Figma 40:796 */}
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Review line items with AI"
                onPress={() => setShowAiModal(true)}
                className="py-1 px-2.5 bg-warningSoft border border-warning/30 rounded-md"
              >
                <Text variant="Caption" tone="warning" className="font-medium">
                  Review with AI
                </Text>
              </Pressable>
            </View>

            {lineItems.map((item, idx) => (
              <View
                key={item.id}
                className="mb-3.5 pb-3 border-b border-border"
              >
                <View className="flex-row justify-between items-center mb-2">
                  <TextInput
                    placeholder="Service description"
                    placeholderTextColor="#8a99ad"
                    value={item.description}
                    onChangeText={(val) =>
                      handleUpdateLineItem(idx, "description", val)
                    }
                    className="flex-1 bg-surfaceAlt border border-border rounded-md px-3 py-2 text-text text-[14px]"
                  />
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`Remove item ${idx + 1}`}
                    onPress={() => handleRemoveLineItem(idx)}
                    className="p-2 ml-1"
                  >
                    <Text variant="Caption" tone="negative">
                      ✕
                    </Text>
                  </Pressable>
                </View>

                <View className="flex-row items-center gap-2">
                  <View className="w-20">
                    <Text variant="Caption" tone="muted" className="mb-1">
                      Qty
                    </Text>
                    <TextInput
                      placeholder="1"
                      placeholderTextColor="#8a99ad"
                      keyboardType="numeric"
                      value={item.quantity}
                      onChangeText={(val) =>
                        handleUpdateLineItem(idx, "quantity", val)
                      }
                      className="bg-surfaceAlt border border-border rounded-md px-3 py-1.5 text-text text-[14px]"
                    />
                  </View>
                  <Text
                    variant="Caption"
                    tone="muted"
                    className="self-end mb-2"
                  >
                    ×
                  </Text>
                  <View className="flex-1">
                    <Text variant="Caption" tone="muted" className="mb-1">
                      Price ($)
                    </Text>
                    <TextInput
                      placeholder="0.00"
                      placeholderTextColor="#8a99ad"
                      keyboardType="numeric"
                      value={item.unitPrice}
                      onChangeText={(val) =>
                        handleUpdateLineItem(idx, "unitPrice", val)
                      }
                      className="bg-surfaceAlt border border-border rounded-md px-3 py-1.5 text-text text-[14px]"
                    />
                  </View>
                  <View className="items-end min-w-[70px] self-end mb-2">
                    <Text variant="Body" className="font-semibold text-text">
                      $
                      {(
                        (Number.parseFloat(item.quantity) || 0) *
                        (Number.parseFloat(item.unitPrice) || 0)
                      ).toFixed(2)}
                    </Text>
                  </View>
                </View>
              </View>
            ))}

            {/* + Add line item Figma 36:656 */}
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Add line item"
              onPress={handleAddLineItem}
              className="py-2 items-center justify-center bg-surfaceAlt rounded-md mt-1"
            >
              <Text variant="Caption" tone="primary" className="font-medium">
                + Add line item
              </Text>
            </Pressable>
          </View>

          {/* Invoice Summary Card Figma 36:657 */}
          <View className="bg-surface border border-border rounded-[14px] p-4 mb-6">
            <View className="flex-row justify-between items-center mb-2">
              <Text variant="Body" tone="muted">
                Subtotal
              </Text>
              <Text variant="Body" className="font-medium text-text">
                ${subtotal.toFixed(2)}
              </Text>
            </View>

            <View className="flex-row justify-between items-center mb-3">
              <Text variant="Body" tone="muted">
                Tax ($0.00)
              </Text>
              <Text variant="Body" className="font-medium text-text">
                ${tax.toFixed(2)}
              </Text>
            </View>

            <View className="h-px bg-border my-2" />

            <View className="flex-row justify-between items-center mt-1">
              <Text variant="Title" className="font-semibold text-text">
                TOTAL
              </Text>
              <Text variant="Title" tone="primary" className="font-semibold">
                ${total.toFixed(2)}
              </Text>
            </View>
          </View>

          {/* Action buttons */}
          <View className="flex-row gap-3">
            <View className="flex-1">
              <Button title="Cancel" variant="secondary" onPress={onClose} />
            </View>
            <View className="flex-1">
              <Button
                title="Preview invoice"
                variant="primary"
                onPress={handleCreateAndPreview}
              />
            </View>
          </View>
        </ScrollView>
      </View>

      {/* Client Picker Modal */}
      <Modal
        visible={showClientPicker}
        transparent
        animationType="fade"
        onRequestClose={() => setShowClientPicker(false)}
      >
        <View className="flex-1 bg-black/50 items-center justify-center px-4">
          <View className="bg-surface border border-border rounded-xl p-5 w-full max-w-sm max-h-[80%]">
            <Text variant="Title" className="font-semibold text-text mb-4">
              Select Client
            </Text>
            <ScrollView className="gap-2">
              {clients.map((c) => (
                <Pressable
                  key={c.id}
                  accessibilityRole="button"
                  accessibilityLabel={`Select client ${c.name}`}
                  onPress={() => {
                    setSelectedClient(c);
                    setShowClientPicker(false);
                  }}
                  className={`p-3 rounded-md border ${
                    selectedClient?.id === c.id
                      ? "border-primary bg-primarySoft"
                      : "border-border bg-surface"
                  }`}
                >
                  <Text variant="Body" className="font-semibold text-text">
                    {c.name}
                  </Text>
                  <Text variant="Caption" tone="muted" className="mt-0.5">
                    {c.email}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
            <Button
              title="Done"
              variant="secondary"
              className="mt-4"
              onPress={() => setShowClientPicker(false)}
            />
          </View>
        </View>
      </Modal>

      {/* AI Invoice Review Modal */}
      <AiInvoiceReviewModal
        visible={showAiModal}
        draftData={{
          clientName: selectedClient?.name ?? "Riverbend Creative LLC",
          clientEmail: selectedClient?.email ?? "accounts@riverbend.co",
          prompt: `Invoice ${selectedClient?.name ?? "Riverbend Creative"} for brand identity consultation and bookkeeping.`,
          items: [
            {
              description: "Brand identity consultation",
              quantity: 1,
              unitPrice: 680,
            },
            {
              description: "Monthly bookkeeping",
              quantity: 2,
              unitPrice: 125,
            },
          ],
        }}
        onClose={() => setShowAiModal(false)}
        onApplyDraft={handleAiDraftApply}
      />
    </Modal>
  );
}
