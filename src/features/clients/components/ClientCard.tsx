import { Pressable, View } from "react-native";
import { Text } from "@/components/ui/Text";
import type { Client } from "../types";

export interface ClientCardProps {
  client: Client;
  onPress: () => void;
}

export function ClientCard({ client, onPress }: ClientCardProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Client: ${client.name}, ${client.invoicesCount} invoices`}
      onPress={onPress}
      className="bg-surface border border-border rounded-[14px] p-3.5 flex-row items-center justify-between"
    >
      <View className="flex-1 mr-3">
        <Text variant="Body" className="font-semibold text-text">
          {client.name}
        </Text>
        <Text variant="Caption" tone="muted" className="mt-1">
          {client.email}
        </Text>
      </View>
      <View className="items-end">
        <Text variant="Body" className="font-semibold text-text">
          {client.invoicesCount}{" "}
          {client.invoicesCount === 1 ? "invoice" : "invoices"}
        </Text>
        {client.outstandingAmount > 0 ? (
          <Text variant="Caption" tone="primary" className="mt-1">
            ${client.outstandingAmount.toFixed(0)} due
          </Text>
        ) : null}
      </View>
    </Pressable>
  );
}
