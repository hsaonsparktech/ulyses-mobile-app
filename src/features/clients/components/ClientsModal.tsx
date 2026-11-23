import { useMemo, useState } from "react";
import { Modal, Pressable, ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Text } from "@/components/ui/Text";
import { useClientStore } from "../store";
import type { Client } from "../types";
import { AddClientModal } from "./AddClientModal";
import { ClientCard } from "./ClientCard";
import { ClientDetailModal } from "./ClientDetailModal";

export interface ClientsModalProps {
  visible: boolean;
  businessId: string;
  businessName: string;
  onClose: () => void;
  onCreateInvoiceForClient?: (client: Client) => void;
}

export function ClientsModal({
  visible,
  businessId,
  businessName,
  onClose,
  onCreateInvoiceForClient,
}: ClientsModalProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [showAddClient, setShowAddClient] = useState(false);

  const allClients = useClientStore((s) => s.clients);
  const clients = useMemo(
    () => allClients.filter((c) => c.businessId === businessId),
    [allClients, businessId],
  );

  const filteredClients = useMemo(() => {
    if (!searchQuery.trim()) return clients;
    const q = searchQuery.toLowerCase();
    return clients.filter(
      (c) =>
        c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q),
    );
  }, [clients, searchQuery]);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView className="flex-1 bg-canvas" edges={["top", "bottom"]}>
        <ScrollView
          className="flex-1 px-4 pt-2"
          contentContainerStyle={{ paddingBottom: 40 }}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View className="flex-row justify-between items-start mb-4">
            <View>
              <Text variant="Title" className="font-semibold text-text">
                Clients
              </Text>
              <Text variant="Caption" tone="muted" className="mt-1">
                Contacts and invoice history
              </Text>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Close clients directory"
              testID="close-clients-modal"
              collapsable={false}
              onPress={onClose}
              className="py-2 px-4 bg-surface border border-border rounded-md min-h-[44px] justify-center items-center"
            >
              <Text variant="Caption" tone="text" className="font-medium">
                Done
              </Text>
            </Pressable>
          </View>

          {/* Search Card Figma 37:810 */}
          <View className="mb-4">
            <Input
              label="Search clients"
              placeholder="Search name or company..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoCapitalize="none"
            />
          </View>

          {/* Clients List */}
          <View className="gap-2.5 mb-6">
            {filteredClients.map((client) => (
              <ClientCard
                key={client.id}
                client={client}
                onPress={() => setSelectedClient(client)}
              />
            ))}
            {filteredClients.length === 0 && (
              <View className="bg-surface border border-border rounded-[14px] p-6 items-center">
                <Text variant="Body" tone="muted" className="text-center">
                  No clients found.
                </Text>
              </View>
            )}
          </View>

          {/* Client Snapshot Card Figma 37:824 */}
          <View className="bg-surface border border-border rounded-[14px] p-4 mb-6">
            <Text variant="Caption" tone="muted">
              CLIENT SUMMARY
            </Text>
            <Text variant="Title" className="font-semibold text-text mt-2">
              {clients.length} active{" "}
              {clients.length === 1 ? "client" : "clients"}
            </Text>
            <View className="h-px bg-border my-3" />
            <Text variant="Caption" tone="muted">
              Invoice history and contact profiles
            </Text>
          </View>

          {/* Add Client Button Figma 37:829 */}
          <Button
            title="Add client"
            variant="primary"
            onPress={() => setShowAddClient(true)}
          />
        </ScrollView>
      </SafeAreaView>

      {/* Sub-modals */}
      <ClientDetailModal
        client={selectedClient}
        businessName={businessName}
        visible={selectedClient !== null}
        onClose={() => setSelectedClient(null)}
        onCreateInvoiceForClient={(client) => {
          setSelectedClient(null);
          onClose();
          if (onCreateInvoiceForClient) {
            onCreateInvoiceForClient(client);
          }
        }}
      />

      <AddClientModal
        visible={showAddClient}
        businessId={businessId}
        onClose={() => setShowAddClient(false)}
        onSuccess={(newClientId) => {
          const client = clients.find((c) => c.id === newClientId);
          if (client) setSelectedClient(client);
        }}
      />
    </Modal>
  );
}
