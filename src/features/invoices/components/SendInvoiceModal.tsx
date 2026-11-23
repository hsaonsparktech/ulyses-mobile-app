import { useState } from "react";
import { Modal, ScrollView, View } from "react-native";
import { Button } from "@/components/ui/Button";
import { FeedbackIcon } from "@/components/ui/Icon";
import { Input } from "@/components/ui/Input";
import { Text } from "@/components/ui/Text";
import { useInvoiceStore } from "../store";
import type { Invoice } from "../types";

export interface SendInvoiceModalProps {
  invoice: Invoice | null;
  businessName: string;
  visible: boolean;
  onClose: () => void;
  onViewInvoice?: (invoice: Invoice) => void;
}

export function SendInvoiceModal({
  invoice,
  businessName,
  visible,
  onClose,
  onViewInvoice,
}: SendInvoiceModalProps) {
  const updateDeliveryStatus = useInvoiceStore((s) => s.updateDeliveryStatus);

  const [toEmail, setToEmail] = useState(invoice?.clientEmail ?? "");
  const [subject, setSubject] = useState(
    invoice ? `Invoice ${invoice.invoiceNumber} · ${businessName}` : "",
  );
  const [message, setMessage] = useState("Please see attached invoice.");
  const [sentState, setSentState] = useState(false);

  if (!invoice) return null;

  const handleSend = () => {
    updateDeliveryStatus(invoice.id, "Sent");
    setSentState(true);
  };

  const handleResetAndClose = () => {
    setSentState(false);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleResetAndClose}
    >
      <View className="flex-1 bg-canvas">
        <ScrollView
          className="flex-1 px-4 pt-6"
          contentContainerStyle={{ paddingBottom: 40 }}
          keyboardShouldPersistTaps="handled"
        >
          {!sentState ? (
            /* Send invoice form Figma 81:677 */
            <View>
              <View className="mb-6">
                <Text variant="Title" className="font-semibold text-text">
                  Send invoice
                </Text>
                <Text variant="Caption" tone="muted" className="mt-1">
                  Deliver invoice to the customer by email
                </Text>
              </View>

              <View className="gap-4">
                <Input
                  label="To"
                  value={toEmail || invoice.clientEmail}
                  onChangeText={setToEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />

                <Input
                  label="Subject"
                  value={
                    subject ||
                    `Invoice ${invoice.invoiceNumber} · ${businessName}`
                  }
                  onChangeText={setSubject}
                />

                <Input
                  label="Message"
                  value={message}
                  onChangeText={setMessage}
                  multiline
                  numberOfLines={3}
                />

                <View>
                  <Text variant="Label" className="mb-2">
                    Attachment
                  </Text>
                  <View className="bg-surface border border-border rounded-md p-3.5 flex-row justify-between items-center">
                    <Text variant="Body" className="text-text">
                      {invoice.invoiceNumber}.pdf
                    </Text>
                    <Text
                      variant="Caption"
                      tone="primary"
                      className="font-semibold"
                    >
                      ${invoice.total.toFixed(2)}
                    </Text>
                  </View>
                </View>

                {/* Note Figma 81:712 */}
                <View className="bg-surface border border-border rounded-md p-3.5 mt-2">
                  <Text variant="Caption" tone="muted">
                    Recipient and totals must be checked before transmission.
                  </Text>
                </View>
              </View>

              {/* Actions Figma 201:942 */}
              <View className="flex-row gap-3 mt-8">
                <View className="flex-1">
                  <Button
                    title="Back"
                    variant="secondary"
                    onPress={handleResetAndClose}
                  />
                </View>
                <View className="flex-1">
                  <Button
                    title="Send invoice"
                    variant="primary"
                    onPress={handleSend}
                  />
                </View>
              </View>
            </View>
          ) : (
            /* Invoice sent / prepared state Figma 81:1354 */
            <View className="items-center pt-8">
              <View className="w-20 h-20 rounded-full bg-positiveSoft items-center justify-center mb-6">
                <FeedbackIcon variant="success" size={44} />
              </View>

              <Text
                variant="Title"
                className="font-semibold text-text text-center"
              >
                Invoice prepared
              </Text>
              <Text variant="Caption" tone="muted" className="mt-1 text-center">
                Email delivery state
              </Text>

              {/* Card / State details Figma 81:1379 */}
              <View className="bg-surface border border-border rounded-[14px] p-6 my-8 w-full items-center">
                <Text
                  variant="Heading"
                  className="font-semibold text-text text-center mb-3"
                >
                  Invoice is ready to send
                </Text>
                <Text variant="Body" tone="muted" className="text-center">
                  Production must report true delivery status from the email
                  transmission worker.
                </Text>
              </View>

              {/* Actions Figma 201:964 */}
              <View className="flex-row gap-3 w-full">
                <View className="flex-1">
                  <Button
                    title="Back to invoices"
                    variant="secondary"
                    onPress={handleResetAndClose}
                  />
                </View>
                <View className="flex-1">
                  <Button
                    title="View invoice"
                    variant="primary"
                    onPress={() => {
                      handleResetAndClose();
                      if (onViewInvoice) onViewInvoice(invoice);
                    }}
                  />
                </View>
              </View>
            </View>
          )}
        </ScrollView>
      </View>
    </Modal>
  );
}
