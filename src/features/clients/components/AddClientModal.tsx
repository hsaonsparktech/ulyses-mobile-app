import { useState } from "react";
import { Modal, ScrollView, View } from "react-native";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Text } from "@/components/ui/Text";
import { clientSchema } from "../schemas/client";
import { useClientStore } from "../store";

export interface AddClientModalProps {
  visible: boolean;
  businessId: string;
  onClose: () => void;
  onSuccess?: (clientId: string) => void;
}

export function AddClientModal({
  visible,
  businessId,
  onClose,
  onSuccess,
}: AddClientModalProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [billingAddress, setBillingAddress] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const addClient = useClientStore((s) => s.addClient);

  const handleSave = () => {
    const result = clientSchema.safeParse({
      name,
      email,
      phone,
      billingAddress,
      currency: "USD",
    });

    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of result.error.issues) {
        const path = issue.path[0];
        if (typeof path === "string") {
          fieldErrors[path] = issue.message;
        }
      }
      setErrors(fieldErrors);
      return;
    }

    setErrors({});
    const newClient = addClient(businessId, {
      name: result.data.name,
      email: result.data.email,
      phone: result.data.phone,
      billingAddress: result.data.billingAddress,
      currency: result.data.currency,
    });

    setName("");
    setEmail("");
    setPhone("");
    setBillingAddress("");
    onClose();
    if (onSuccess) {
      onSuccess(newClient.id);
    }
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
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View className="mb-6">
            <Text variant="Title" className="font-semibold text-text">
              Add client
            </Text>
            <Text variant="Caption" tone="muted" className="mt-1">
              Create a new customer profile
            </Text>
          </View>

          {/* Form Fields */}
          <View className="gap-4">
            <Input
              label="Company / Client name"
              placeholder="Northstar Creative LLC"
              value={name}
              onChangeText={(val) => {
                setName(val);
                if (errors.name) setErrors((e) => ({ ...e, name: "" }));
              }}
              error={errors.name}
            />

            <Input
              label="Email"
              placeholder="billing@northstar.co"
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={(val) => {
                setEmail(val);
                if (errors.email) setErrors((e) => ({ ...e, email: "" }));
              }}
              error={errors.email}
            />

            <Input
              label="Phone"
              placeholder="(555) 010-0142"
              keyboardType="phone-pad"
              value={phone}
              onChangeText={(val) => {
                setPhone(val);
                if (errors.phone) setErrors((e) => ({ ...e, phone: "" }));
              }}
              error={errors.phone}
            />

            <Input
              label="Billing address"
              placeholder="United States"
              value={billingAddress}
              onChangeText={(val) => {
                setBillingAddress(val);
                if (errors.billingAddress)
                  setErrors((e) => ({ ...e, billingAddress: "" }));
              }}
              error={errors.billingAddress}
            />

            {/* Note card matching Figma 81:621 */}
            <View className="bg-surface border border-border rounded-md p-3.5 mt-2">
              <Text variant="Caption" tone="muted">
                Client details are private and securely stored for this
                business.
              </Text>
            </View>
          </View>

          {/* Action buttons matching Figma 201:940 */}
          <View className="flex-row gap-3 mt-8">
            <View className="flex-1">
              <Button title="Cancel" variant="secondary" onPress={onClose} />
            </View>
            <View className="flex-1">
              <Button
                title="Save client"
                variant="primary"
                onPress={handleSave}
              />
            </View>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}
