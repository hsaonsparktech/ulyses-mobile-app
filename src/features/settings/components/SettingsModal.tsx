import { useState } from "react";
import {
  Alert,
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
import { SubscriptionModal } from "@/features/membership/components/SubscriptionModal";
import { TeamModal } from "@/features/team/components/TeamModal";
import { useSession } from "@/providers/SessionProvider";
import { useSettingsStore } from "../store";
import { AccountProfileModal } from "./AccountProfileModal";

interface SettingsModalProps {
  visible: boolean;
  onClose: () => void;
}

export function SettingsModal({ visible, onClose }: SettingsModalProps) {
  let signOut = async () => {};
  try {
    // biome-ignore lint/correctness/useHookAtTopLevel: safe wrapper for tests without SessionProvider
    const session = useSession();
    signOut = session.signOut;
  } catch {
    // outside SessionProvider
  }
  const { settings, updateSettings } = useSettingsStore();

  const [legalName, setLegalName] = useState(settings.legalName);
  const [dba, setDba] = useState(settings.dba);
  const [terms, setTerms] = useState(settings.defaultPaymentTerms);
  const [method, setMethod] = useState(settings.accountingMethod);

  const [teamOpen, setTeamOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [subscriptionOpen, setSubscriptionOpen] = useState(false);

  const handleSave = () => {
    updateSettings({
      legalName,
      dba,
      defaultPaymentTerms: terms,
      accountingMethod: method,
    });
    Alert.alert(
      "Settings Saved",
      "Your business preferences have been updated.",
      [{ text: "OK" }],
    );
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView className="flex-1 bg-surface" edges={["top", "bottom"]}>
        {/* Header */}
        <View className="flex-row items-center justify-between px-6 pt-2 pb-4 border-b border-border bg-surface">
          <View className="flex-row items-center space-x-3">
            <View className="w-10 h-10 rounded-full bg-surface border border-border items-center justify-center">
              <SvgIcon name="settings" size={20} color="#374151" />
            </View>
            <View collapsable={false}>
              <Text
                className="text-xl font-bold text-text"
                accessibilityRole="header"
              >
                Business Settings
              </Text>
              <Text className="text-xs text-textMuted">
                Figma Frame 37:873 · Ledger Configuration
              </Text>
            </View>
          </View>
          <Pressable
            onPress={onClose}
            className="w-9 h-9 rounded-full bg-surface border border-border items-center justify-center min-h-[44px] min-w-[44px]"
            accessibilityRole="button"
            accessibilityLabel="Close settings"
            collapsable={false}
          >
            <SvgIcon name="x" size={20} color="#374151" />
          </Pressable>
        </View>

        <ScrollView
          className="flex-1 px-6 py-4"
          contentContainerStyle={{ paddingBottom: 40 }}
        >
          {/* Navigation Shortcuts */}
          <View className="space-y-2.5 mb-6">
            <Pressable
              onPress={() => setTeamOpen(true)}
              className="p-4 rounded-2xl bg-surface-secondary border border-border-subtle flex-row items-center justify-between active:bg-surface-tertiary"
              accessibilityLabel="Open team management"
            >
              <View className="flex-row items-center space-x-3">
                <View className="w-9 h-9 rounded-full bg-brand-primary/10 items-center justify-center">
                  <SvgIcon name="users" size={18} color="#1570EF" />
                </View>
                <View>
                  <Text className="text-sm font-bold text-content-primary">
                    Team Access & Roles
                  </Text>
                  <Text className="text-xs text-content-secondary">
                    Manage CPAs, bookkeepers, and staff access
                  </Text>
                </View>
              </View>
              <SvgIcon name="chevron-right" size={20} color="#9CA3AF" />
            </Pressable>

            <Pressable
              onPress={() => setProfileOpen(true)}
              className="p-4 rounded-2xl bg-surface-secondary border border-border-subtle flex-row items-center justify-between active:bg-surface-tertiary"
              accessibilityLabel="Open account profile"
            >
              <View className="flex-row items-center space-x-3">
                <View className="w-9 h-9 rounded-full bg-accent-purple/10 items-center justify-center">
                  <SvgIcon name="user" size={18} color="#7C3AED" />
                </View>
                <View>
                  <Text className="text-sm font-bold text-content-primary">
                    Account Profile & Security
                  </Text>
                  <Text className="text-xs text-content-secondary">
                    Biometric lock, credentials, and identity
                  </Text>
                </View>
              </View>
              <SvgIcon name="chevron-right" size={20} color="#9CA3AF" />
            </Pressable>

            <Pressable
              onPress={() => setSubscriptionOpen(true)}
              className="p-4 rounded-2xl bg-surface-secondary border border-border-subtle flex-row items-center justify-between active:bg-surface-tertiary"
              accessibilityLabel="Open subscription management"
            >
              <View className="flex-row items-center space-x-3">
                <View className="w-9 h-9 rounded-full bg-accent-green/10 items-center justify-center">
                  <SvgIcon name="credit-card" size={18} color="#137754" />
                </View>
                <View>
                  <Text className="text-sm font-bold text-content-primary">
                    Membership & Subscription
                  </Text>
                  <Text className="text-xs text-content-secondary">
                    Plan status, billing cycle, and data export
                  </Text>
                </View>
              </View>
              <SvgIcon name="chevron-right" size={20} color="#9CA3AF" />
            </Pressable>
          </View>

          {/* Legal Business Profile */}
          <Text className="text-xs font-bold text-content-secondary uppercase tracking-wider mb-3">
            Entity & Tax Registration
          </Text>

          <View className="space-y-4 mb-6">
            <View>
              <Text className="text-xs font-semibold text-content-secondary mb-1">
                Legal Entity Name
              </Text>
              <TextInput
                className="w-full bg-surface-secondary border border-border-subtle rounded-xl px-4 py-3 text-sm text-content-primary font-medium"
                value={legalName}
                onChangeText={setLegalName}
                placeholder="Legal Business Name"
              />
            </View>

            <View>
              <Text className="text-xs font-semibold text-content-secondary mb-1">
                Trade Name (DBA)
              </Text>
              <TextInput
                className="w-full bg-surface-secondary border border-border-subtle rounded-xl px-4 py-3 text-sm text-content-primary font-medium"
                value={dba}
                onChangeText={setDba}
                placeholder="Doing Business As"
              />
            </View>

            <View className="flex-row space-x-3">
              <View className="flex-1">
                <Text className="text-xs font-semibold text-content-secondary mb-1">
                  Employer ID (EIN)
                </Text>
                <View className="bg-surface-secondary border border-border-subtle rounded-xl px-4 py-3">
                  <Text className="text-sm text-content-primary font-mono">
                    {settings.ein}
                  </Text>
                </View>
              </View>

              <View className="flex-1">
                <Text className="text-xs font-semibold text-content-secondary mb-1">
                  Currency
                </Text>
                <View className="bg-surface-secondary border border-border-subtle rounded-xl px-4 py-3">
                  <Text className="text-sm text-content-primary font-medium">
                    {settings.currency}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* Accounting Standards */}
          <Text className="text-xs font-bold text-content-secondary uppercase tracking-wider mb-3">
            Accounting Preferences
          </Text>

          <View className="space-y-4 mb-8">
            <View>
              <Text className="text-xs font-semibold text-content-secondary mb-2">
                Accounting Method
              </Text>
              <View className="flex-row space-x-3">
                <Pressable
                  onPress={() => setMethod("Cash")}
                  className={`flex-1 p-3 rounded-xl border items-center ${
                    method === "Cash"
                      ? "border-brand-primary bg-brand-primary/10"
                      : "border-border-subtle bg-surface-secondary"
                  }`}
                >
                  <Text className="text-xs font-bold text-content-primary">
                    Cash Basis
                  </Text>
                </Pressable>

                <Pressable
                  onPress={() => setMethod("Accrual")}
                  className={`flex-1 p-3 rounded-xl border items-center ${
                    method === "Accrual"
                      ? "border-brand-primary bg-brand-primary/10"
                      : "border-border-subtle bg-surface-secondary"
                  }`}
                >
                  <Text className="text-xs font-bold text-content-primary">
                    Accrual Basis
                  </Text>
                </Pressable>
              </View>
            </View>

            <View>
              <Text className="text-xs font-semibold text-content-secondary mb-2">
                Default Invoice Payment Terms
              </Text>
              <View className="flex-row flex-wrap gap-2">
                {(
                  ["Due on Receipt", "Net 15", "Net 30", "Net 60"] as const
                ).map((t) => (
                  <Pressable
                    key={t}
                    onPress={() => setTerms(t)}
                    className={`px-3 py-2 rounded-xl border ${
                      terms === t
                        ? "border-brand-primary bg-brand-primary/10"
                        : "border-border-subtle bg-surface-secondary"
                    }`}
                  >
                    <Text className="text-xs font-semibold text-content-primary">
                      {t}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
          </View>

          {/* Save Button */}
          <View className="space-y-3">
            <Button
              variant="primary"
              title="Save Changes"
              onPress={handleSave}
              accessibilityLabel="Save business settings"
            />

            <Pressable
              onPress={() => {
                onClose();
                signOut();
              }}
              className="w-full py-3 items-center justify-center rounded-xl border border-feedback-danger/30 bg-feedback-danger/5"
              accessibilityLabel="Sign out of Libros"
            >
              <Text className="text-sm font-semibold text-feedback-danger">
                Sign Out
              </Text>
            </Pressable>
          </View>
        </ScrollView>

        {/* Sub-modals */}
        <TeamModal visible={teamOpen} onClose={() => setTeamOpen(false)} />
        <AccountProfileModal
          visible={profileOpen}
          onClose={() => setProfileOpen(false)}
        />
        <SubscriptionModal
          visible={subscriptionOpen}
          onClose={() => setSubscriptionOpen(false)}
        />
      </SafeAreaView>
    </Modal>
  );
}
