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
import { Text } from "@/components/ui/Text";
import { useClientStore } from "@/features/clients/store";
import type { Client } from "@/features/clients/types";
import { useEstimateStore } from "../store";
import type { Estimate } from "../types";

export interface EstimateBuilderModalProps {
  visible: boolean;
  businessId: string;
  onClose: () => void;
  onEstimateCreated: (estimate: Estimate) => void;
}

interface FormLineItem {
  id: string;
  description: string;
  quantity: string;
  unitPrice: string;
}

export function EstimateBuilderModal({
  visible,
  businessId,
  onClose,
  onEstimateCreated,
}: EstimateBuilderModalProps) {
  const allClients = useClientStore((s) => s.clients);
  const clients = useMemo(
    () => allClients.filter((c) => c.businessId === businessId),
    [allClients, businessId],
  );
  const addEstimate = useEstimateStore((s) => s.addEstimate);

  const [selectedClient, setSelectedClient] = useState<Client | null>(
    clients[0] ?? null,
  );
  const [showClientPicker, setShowClientPicker] = useState(false);
  const [estimateName, setEstimateName] = useState("Branding package proposal");

  const [lineItems, setLineItems] = useState<FormLineItem[]>([
    {
      id: "est-init-1",
      description: "Brand strategy workshop",
      quantity: "1",
      unitPrice: "500",
    },
    {
      id: "est-init-2",
      description: "Visual identity kit",
      quantity: "1",
      unitPrice: "850",
    },
  ]);

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

  const total = calculatedItems.reduce((acc, curr) => acc + curr.amount, 0);

  const handleAddLineItem = () => {
    setLineItems((prev) => [
      ...prev,
      {
        id: `est-item-${Date.now()}`,
        description: "New proposal item",
        quantity: "1",
        unitPrice: "250",
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
      Alert.alert("Notice", "An estimate must have at least one line item.");
      return;
    }
    setLineItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handlePreviewEstimate = () => {
    if (!selectedClient) {
      Alert.alert("Validation", "Please select a client for this estimate.");
      return;
    }
    if (!estimateName.trim()) {
      Alert.alert("Validation", "Please provide a name for this estimate.");
      return;
    }

    const created = addEstimate(businessId, {
      name: estimateName,
      clientId: selectedClient.id,
      clientName: selectedClient.name,
      clientEmail: selectedClient.email,
      date: "Nov 08, 2026",
      currency: "USD",
      items: calculatedItems.map((item) => ({
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
      })),
      tax: 0,
      status: "Draft",
    });

    onClose();
    onEstimateCreated(created);
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
          {/* Header Figma 37:746 */}
          <View className="mb-5">
            <Text variant="Title" className="font-semibold text-text">
              Create estimate
            </Text>
            <Text variant="Caption" tone="muted" className="mt-1">
              Quotation draft · USD
            </Text>
          </View>

          {/* Client Field Figma 37:767 */}
          <View className="mb-4">
            <Text variant="Label" className="mb-2">
              Client
            </Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Select client for estimate"
              onPress={() => setShowClientPicker(true)}
              className="bg-surface border border-border rounded-md p-3.5"
            >
              <Text variant="Body" className="font-medium text-text">
                {selectedClient?.name ?? "Select client..."}
              </Text>
              <Text variant="Caption" tone="muted" className="mt-0.5">
                {selectedClient?.email ?? "No client selected"}
              </Text>
            </Pressable>
          </View>

          {/* Estimate Name Field Figma 37:770 */}
          <View className="mb-4">
            <Input
              label="Estimate name"
              value={estimateName}
              onChangeText={setEstimateName}
              placeholder="e.g. Branding package proposal"
            />
          </View>

          {/* Estimate Items Card Figma 37:773 */}
          <View className="bg-surface border border-border rounded-[14px] p-4 mb-4">
            <Text variant="Caption" tone="muted" className="font-semibold mb-3">
              BRANDING SERVICES
            </Text>

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

          {/* Estimate totals card Figma 37:781 */}
          <View className="bg-surface border border-border rounded-[14px] p-4 mb-4">
            <Text variant="Caption" tone="muted">
              TOTAL ESTIMATE
            </Text>
            <Text
              variant="Display"
              className="font-semibold text-text mt-1 text-[28px]"
            >
              ${total.toFixed(2)}
            </Text>
          </View>

          <Text variant="Caption" tone="muted" className="mb-6 px-1">
            Conversion to invoice: available upon quote acceptance.
          </Text>

          {/* Actions */}
          <View className="flex-row gap-3">
            <View className="flex-1">
              <Button title="Cancel" variant="secondary" onPress={onClose} />
            </View>
            <View className="flex-1">
              <Button
                title="Preview estimate"
                variant="primary"
                onPress={handlePreviewEstimate}
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
    </Modal>
  );
}
