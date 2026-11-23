import { useState } from "react";
import { Modal, ScrollView, View } from "react-native";
import { Button } from "@/components/ui/Button";
import { FeedbackIcon } from "@/components/ui/Icon";
import { Input } from "@/components/ui/Input";
import { Text } from "@/components/ui/Text";
import { useEstimateStore } from "../store";
import type { Estimate } from "../types";

export interface SendEstimateModalProps {
  estimate: Estimate | null;
  businessName: string;
  visible: boolean;
  onClose: () => void;
}

export function SendEstimateModal({
  estimate,
  businessName,
  visible,
  onClose,
}: SendEstimateModalProps) {
  const updateEstimateStatus = useEstimateStore((s) => s.updateEstimateStatus);

  const [toEmail, setToEmail] = useState(estimate?.clientEmail ?? "");
  const [subject, setSubject] = useState(
    estimate ? `Estimate ${estimate.estimateNumber} · ${businessName}` : "",
  );
  const [message, setMessage] = useState(
    "Please see attached estimate quotation for review.",
  );
  const [sentState, setSentState] = useState(false);

  if (!estimate) return null;

  const handleSend = () => {
    updateEstimateStatus(estimate.id, "Sent");
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
            /* Share estimate form Figma 86:502 */
            <View>
              <View className="mb-6">
                <Text variant="Title" className="font-semibold text-text">
                  Share estimate
                </Text>
                <Text variant="Caption" tone="muted" className="mt-1">
                  Send a quotation to the customer
                </Text>
              </View>

              <View className="gap-4">
                <Input
                  label="To"
                  value={toEmail || estimate.clientEmail}
                  onChangeText={setToEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />

                <Input
                  label="Subject"
                  value={
                    subject ||
                    `Estimate ${estimate.estimateNumber} · ${businessName}`
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
                      {estimate.estimateNumber}.pdf
                    </Text>
                    <Text
                      variant="Caption"
                      tone="primary"
                      className="font-semibold"
                    >
                      ${estimate.total.toFixed(2)}
                    </Text>
                  </View>
                </View>

                {/* Note Figma 86:519 */}
                <View className="bg-surface border border-border rounded-md p-3.5 mt-2">
                  <Text variant="Caption" tone="muted">
                    Check the quotation and recipient before sending.
                  </Text>
                </View>
              </View>

              {/* Actions Figma 201:945 */}
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
                    title="Send estimate"
                    variant="primary"
                    onPress={handleSend}
                  />
                </View>
              </View>
            </View>
          ) : (
            /* Estimate sent state */
            <View className="items-center pt-8">
              <View className="w-20 h-20 rounded-full bg-positiveSoft items-center justify-center mb-6">
                <FeedbackIcon variant="success" size={44} />
              </View>

              <Text
                variant="Title"
                className="font-semibold text-text text-center"
              >
                Estimate sent
              </Text>
              <Text variant="Caption" tone="muted" className="mt-1 text-center">
                Quotation delivered to {toEmail}
              </Text>

              <View className="bg-surface border border-border rounded-[14px] p-6 my-8 w-full items-center">
                <Text
                  variant="Heading"
                  className="font-semibold text-text text-center mb-2"
                >
                  Estimate {estimate.estimateNumber} is active
                </Text>
                <Text variant="Body" tone="muted" className="text-center">
                  Status updated to Sent. You can convert this to an invoice
                  whenever the client accepts the quote.
                </Text>
              </View>

              <Button
                title="Done"
                variant="primary"
                className="w-full"
                onPress={handleResetAndClose}
              />
            </View>
          )}
        </ScrollView>
      </View>
    </Modal>
  );
}
