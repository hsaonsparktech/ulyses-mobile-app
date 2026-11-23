import { useState } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button } from "@/components/ui/Button";
import { SvgIcon } from "@/components/ui/SvgIcon";

interface RequestAccessModalProps {
  visible: boolean;
  onClose: () => void;
}

export function RequestAccessModal({
  visible,
  onClose,
}: RequestAccessModalProps) {
  const [selectedPermission, setSelectedPermission] = useState<string>(
    "Export financial reports",
  );
  const [reason, setReason] = useState("");
  const [isSent, setIsSent] = useState(false);

  const permissions = [
    {
      title: "Export financial reports",
      desc: "Download CSV and PDF reports for third-party auditing.",
    },
    {
      title: "View company banking",
      desc: "Access read-only bank feeds and balance reconciliations.",
    },
    {
      title: "Manage client invoices",
      desc: "Draft and review outgoing client billing invoices.",
    },
  ];

  const handleSubmit = () => {
    setIsSent(true);
  };

  const handleReset = () => {
    setIsSent(false);
    setReason("");
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleReset}
    >
      <SafeAreaView className="flex-1 bg-surface" edges={["top", "bottom"]}>
        {/* Header */}
        <View className="flex-row items-center justify-between px-6 pt-2 pb-4 border-b border-border bg-surface">
          <View className="flex-row items-center space-x-3">
            <View className="w-10 h-10 rounded-full bg-primary/10 items-center justify-center">
              <SvgIcon name="shield" size={20} color="#1570EF" />
            </View>
            <View collapsable={false}>
              <Text
                className="text-xl font-bold text-text"
                accessibilityRole="header"
              >
                {isSent ? "Request Sent" : "Request Access"}
              </Text>
              <Text className="text-xs text-textMuted">
                {isSent ? "Figma Frame 88:334" : "Figma Frame 84:48"} · Role
                Permission Update
              </Text>
            </View>
          </View>
          <Pressable
            onPress={handleReset}
            className="w-9 h-9 rounded-full bg-surface border border-border items-center justify-center min-h-[44px] min-w-[44px]"
            accessibilityRole="button"
            accessibilityLabel="Close request access"
            collapsable={false}
          >
            <SvgIcon name="x" size={20} color="#6B7280" />
          </Pressable>
        </View>

        {isSent ? (
          /* Figma 88:334 Access request sent */
          <View className="flex-1 px-6 items-center justify-center">
            <View className="w-20 h-20 rounded-full bg-feedback-success/10 items-center justify-center mb-5">
              <SvgIcon name="check-circle" size={40} color="#059669" />
            </View>

            <Text className="text-2xl font-bold text-content-primary mb-2 text-center">
              Request Sent to Owner
            </Text>

            <Text className="text-sm text-content-secondary text-center mb-8 px-4 leading-5">
              Your request for "{selectedPermission}" has been delivered to your
              business owner at Acme Services LLC. You will receive an alert
              once approved.
            </Text>

            <View className="w-full">
              <Button
                variant="primary"
                title="Return to Access Profile"
                onPress={handleReset}
                accessibilityLabel="Return to profile"
              />
            </View>
          </View>
        ) : (
          /* Figma 84:48 Request access form */
          <ScrollView
            className="flex-1 px-6 py-4"
            contentContainerStyle={{ paddingBottom: 40 }}
          >
            <Text className="text-xs font-bold text-content-secondary uppercase tracking-wider mb-3">
              Select Desired Permission
            </Text>

            <View className="space-y-3 mb-6">
              {permissions.map((p) => {
                const isSelected = selectedPermission === p.title;
                return (
                  <Pressable
                    key={p.title}
                    onPress={() => setSelectedPermission(p.title)}
                    className={`p-4 rounded-2xl border ${
                      isSelected
                        ? "bg-brand-primary/5 border-brand-primary"
                        : "bg-surface-secondary border-border-subtle"
                    }`}
                  >
                    <View className="flex-row items-center justify-between mb-1">
                      <Text
                        className={`text-sm font-bold ${
                          isSelected
                            ? "text-brand-primary"
                            : "text-content-primary"
                        }`}
                      >
                        {p.title}
                      </Text>
                      <View
                        className={`w-5 h-5 rounded-full border items-center justify-center ${
                          isSelected
                            ? "bg-brand-primary border-brand-primary"
                            : "border-border-strong bg-white"
                        }`}
                      >
                        {isSelected && (
                          <SvgIcon name="check" size={12} color="#FFFFFF" />
                        )}
                      </View>
                    </View>
                    <Text className="text-xs text-content-secondary leading-4">
                      {p.desc}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <Text className="text-xs font-bold text-content-secondary uppercase tracking-wider mb-2">
              Business Justification (Optional)
            </Text>
            <TextInput
              className="bg-surface-secondary p-4 rounded-2xl border border-border-subtle text-sm text-content-primary mb-6 min-h-24"
              placeholder="Explain why you require this elevated access level..."
              placeholderTextColor="#9CA3AF"
              multiline
              value={reason}
              onChangeText={setReason}
            />

            <View className="space-y-3">
              <Button
                variant="primary"
                title="Submit Access Request"
                onPress={handleSubmit}
                accessibilityLabel="Submit access request"
              />
              <Button
                variant="secondary"
                title="Cancel"
                onPress={handleReset}
                accessibilityLabel="Cancel request"
              />
            </View>
          </ScrollView>
        )}
      </SafeAreaView>
    </Modal>
  );
}
