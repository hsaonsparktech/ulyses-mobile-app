import { useState } from "react";
import { Alert, Modal, Pressable, Text, TextInput, View } from "react-native";
import { Button } from "@/components/ui/Button";
import { SvgIcon } from "@/components/ui/SvgIcon";
import { useTeamStore } from "../store";
import type { TeamRole } from "../types";

interface InviteMemberModalProps {
  visible: boolean;
  onClose: () => void;
}

export function InviteMemberModal({
  visible,
  onClose,
}: InviteMemberModalProps) {
  const inviteMember = useTeamStore((s) => s.inviteMember);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<TeamRole>("Accountant");
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSend = () => {
    if (!name.trim() || !email.trim()) {
      Alert.alert(
        "Missing Fields",
        "Please enter member name and email address.",
      );
      return;
    }
    inviteMember(name.trim(), email.trim(), role);
    setIsSuccess(true);
  };

  const handleDone = () => {
    setIsSuccess(false);
    setName("");
    setEmail("");
    setRole("Accountant");
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-surface-primary">
        {/* Header */}
        <View className="flex-row items-center justify-between px-6 pt-6 pb-4 border-b border-border-subtle bg-surface-primary">
          <View className="flex-row items-center space-x-3">
            <View className="w-10 h-10 rounded-full bg-brand-primary/10 items-center justify-center">
              <SvgIcon name="user-plus" size={20} color="#1570EF" />
            </View>
            <View>
              <Text className="text-xl font-bold text-content-primary">
                {isSuccess ? "Invitation Dispatched" : "Invite Team Member"}
              </Text>
              <Text className="text-xs text-content-secondary">
                {isSuccess
                  ? "Figma Frame 86:681 · Sent"
                  : "Figma Frame 81:993 · Access Grant"}
              </Text>
            </View>
          </View>
          <Pressable
            onPress={onClose}
            className="w-9 h-9 rounded-full bg-surface-secondary items-center justify-center"
            accessibilityLabel="Close invite modal"
          >
            <SvgIcon name="x" size={20} color="#374151" />
          </Pressable>
        </View>

        {isSuccess ? (
          /* Figma 86:681 Invite Sent */
          <View className="flex-1 px-6 items-center justify-center">
            <View className="w-20 h-20 rounded-full bg-feedback-success/10 items-center justify-center mb-5">
              <SvgIcon name="check" size={36} color="#059669" strokeWidth={3} />
            </View>
            <Text className="text-2xl font-bold text-content-primary mb-2 text-center">
              Invite Dispatched
            </Text>
            <Text className="text-sm text-content-secondary text-center max-w-xs mb-8 leading-5">
              We sent an email invitation to{" "}
              <Text className="font-bold text-content-primary">{email}</Text>{" "}
              with secure single-use access link for role:{" "}
              <Text className="font-bold text-brand-primary">{role}</Text>.
            </Text>
            <Button
              variant="primary"
              title="Done"
              onPress={handleDone}
              accessibilityLabel="Return to team list"
            />
          </View>
        ) : (
          /* Figma 81:993 Invite Form */
          <View className="flex-1 px-6 py-6 justify-between">
            <View className="space-y-4">
              <View>
                <Text className="text-xs font-semibold text-content-secondary mb-1">
                  Full Name
                </Text>
                <TextInput
                  className="w-full bg-surface-secondary border border-border-subtle rounded-xl px-4 py-3 text-sm text-content-primary font-medium"
                  placeholder="e.g. Maria Gonzalez"
                  placeholderTextColor="#9CA3AF"
                  value={name}
                  onChangeText={setName}
                />
              </View>

              <View>
                <Text className="text-xs font-semibold text-content-secondary mb-1">
                  Email Address
                </Text>
                <TextInput
                  className="w-full bg-surface-secondary border border-border-subtle rounded-xl px-4 py-3 text-sm text-content-primary font-medium"
                  placeholder="name@company.com"
                  placeholderTextColor="#9CA3AF"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              <View>
                <Text className="text-xs font-semibold text-content-secondary mb-2">
                  Select Role & Permission Level
                </Text>
                <View className="space-y-2.5">
                  <Pressable
                    onPress={() => setRole("Accountant")}
                    className={`p-3.5 rounded-xl border ${
                      role === "Accountant"
                        ? "border-brand-primary bg-brand-primary/5"
                        : "border-border-subtle bg-surface-secondary"
                    }`}
                  >
                    <View className="flex-row items-center justify-between mb-1">
                      <Text className="text-sm font-bold text-content-primary">
                        Accountant (CPA / Bookkeeper)
                      </Text>
                      {role === "Accountant" && (
                        <SvgIcon
                          name="check-circle"
                          size={16}
                          color="#1570EF"
                        />
                      )}
                    </View>
                    <Text className="text-xs text-content-secondary leading-4">
                      Can inspect reports, tax forms, transactions, and export
                      CSV/PDFs. Cannot alter bank connections.
                    </Text>
                  </Pressable>

                  <Pressable
                    onPress={() => setRole("Employee")}
                    className={`p-3.5 rounded-xl border ${
                      role === "Employee"
                        ? "border-brand-primary bg-brand-primary/5"
                        : "border-border-subtle bg-surface-secondary"
                    }`}
                  >
                    <View className="flex-row items-center justify-between mb-1">
                      <Text className="text-sm font-bold text-content-primary">
                        Employee (Staff / Field Worker)
                      </Text>
                      {role === "Employee" && (
                        <SvgIcon
                          name="check-circle"
                          size={16}
                          color="#1570EF"
                        />
                      )}
                    </View>
                    <Text className="text-xs text-content-secondary leading-4">
                      Can capture receipts, submit expense drafts, and view
                      personal activity. Restricted from business revenues.
                    </Text>
                  </Pressable>
                </View>
              </View>
            </View>

            <View className="pt-6 border-t border-border-subtle">
              <Button
                variant="primary"
                title="Send Invitation"
                onPress={handleSend}
                accessibilityLabel="Send invitation email"
              />
            </View>
          </View>
        )}
      </View>
    </Modal>
  );
}
