import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  Switch,
  Text,
  View,
} from "react-native";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { SvgIcon } from "@/components/ui/SvgIcon";
import { useSettingsStore } from "../store";

interface AccountProfileModalProps {
  visible: boolean;
  onClose: () => void;
}

export function AccountProfileModal({
  visible,
  onClose,
}: AccountProfileModalProps) {
  const { settings, updateSettings } = useSettingsStore();

  const handlePasswordReset = () => {
    Alert.alert(
      "Password Reset Link Sent",
      "A secure reset link has been emailed to alex@acmeservices.com.",
      [{ text: "OK" }],
    );
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
              <SvgIcon name="user" size={20} color="#1570EF" />
            </View>
            <View>
              <Text className="text-xl font-bold text-content-primary">
                Account Profile
              </Text>
              <Text className="text-xs text-content-secondary">
                Figma Frame 81:1123 · Security & Identity
              </Text>
            </View>
          </View>
          <Pressable
            onPress={onClose}
            className="w-9 h-9 rounded-full bg-surface-secondary items-center justify-center"
            accessibilityLabel="Close profile"
          >
            <SvgIcon name="x" size={20} color="#374151" />
          </Pressable>
        </View>

        <ScrollView
          className="flex-1 px-6 py-6"
          contentContainerStyle={{ paddingBottom: 40 }}
        >
          {/* Identity card */}
          <View className="items-center p-6 bg-surface-secondary rounded-3xl border border-border-subtle mb-6">
            <View className="w-20 h-20 rounded-full bg-brand-primary items-center justify-center mb-3">
              <Text className="text-2xl font-bold text-white">AM</Text>
            </View>
            <Text className="text-lg font-bold text-content-primary">
              Alex Morgan
            </Text>
            <Text className="text-xs text-content-secondary mt-0.5 mb-2">
              alex@acmeservices.com
            </Text>
            <Badge variant="primary" size="md" label="Primary Business Owner" />
          </View>

          {/* Security & Preferences */}
          <Text className="text-xs font-bold text-content-secondary uppercase tracking-wider mb-3">
            Security & Authentication
          </Text>

          <View className="space-y-3 mb-6">
            <View className="p-4 rounded-2xl bg-surface-secondary border border-border-subtle flex-row items-center justify-between">
              <View className="flex-1 mr-3">
                <Text className="text-sm font-semibold text-content-primary">
                  Biometric App Lock
                </Text>
                <Text className="text-xs text-content-secondary mt-0.5">
                  Require Face ID or Fingerprint on app reopen
                </Text>
              </View>
              <Switch
                value={settings.biometricLockEnabled}
                onValueChange={(val) =>
                  updateSettings({ biometricLockEnabled: val })
                }
                thumbColor={
                  settings.biometricLockEnabled ? "#1570EF" : "#F3F4F6"
                }
                trackColor={{ true: "#93C5FD", false: "#E5E7EB" }}
              />
            </View>

            <Pressable
              onPress={handlePasswordReset}
              className="p-4 rounded-2xl bg-surface-secondary border border-border-subtle flex-row items-center justify-between"
            >
              <View>
                <Text className="text-sm font-semibold text-content-primary">
                  Password & Credentials
                </Text>
                <Text className="text-xs text-content-secondary mt-0.5">
                  Last changed 42 days ago
                </Text>
              </View>
              <SvgIcon name="chevron-right" size={20} color="#9CA3AF" />
            </Pressable>
          </View>

          <Button
            variant="secondary"
            title="Close"
            onPress={onClose}
            accessibilityLabel="Close account profile"
          />
        </ScrollView>
      </View>
    </Modal>
  );
}
