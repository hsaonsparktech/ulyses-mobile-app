import { Modal, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Badge } from "@/components/ui/Badge";
import { SvgIcon } from "@/components/ui/SvgIcon";
import { useTeamStore } from "../store";

interface RolePermissionsModalProps {
  visible: boolean;
  onClose: () => void;
}

export function RolePermissionsModal({
  visible,
  onClose,
}: RolePermissionsModalProps) {
  const permissions = useTeamStore((s) => s.permissions);

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
            <View className="w-10 h-10 rounded-full bg-accent-purple/10 items-center justify-center">
              <SvgIcon name="shield" size={20} color="#7C3AED" />
            </View>
            <View collapsable={false}>
              <Text
                className="text-xl font-bold text-text"
                accessibilityRole="header"
              >
                Role Permissions
              </Text>
              <Text className="text-xs text-textMuted">
                Figma Frame 81:1034 · Granular RBAC Matrix
              </Text>
            </View>
          </View>
          <Pressable
            onPress={onClose}
            className="w-9 h-9 rounded-full bg-surface border border-border items-center justify-center min-h-[44px] min-w-[44px]"
            accessibilityRole="button"
            accessibilityLabel="Close role permissions"
            collapsable={false}
          >
            <SvgIcon name="x" size={20} color="#6B7280" />
          </Pressable>
        </View>

        <ScrollView
          className="flex-1 px-6 py-4"
          contentContainerStyle={{ paddingBottom: 40 }}
        >
          <Text className="text-xs font-bold text-content-secondary uppercase tracking-wider mb-3">
            System Permission Boundaries
          </Text>

          <View className="space-y-4">
            {permissions.map((perm) => (
              <View
                key={perm.id}
                className="p-4 rounded-2xl bg-surface-secondary border border-border-subtle"
              >
                <Text className="text-sm font-bold text-content-primary mb-1">
                  {perm.name}
                </Text>
                <Text className="text-xs text-content-secondary leading-4 mb-3">
                  {perm.description}
                </Text>

                <View className="flex-row items-center space-x-2 pt-2 border-t border-border-subtle">
                  <Text className="text-[11px] font-semibold text-content-secondary mr-1">
                    Allowed:
                  </Text>
                  {perm.allowedRoles.map((r) => (
                    <Badge
                      key={r}
                      variant={
                        r === "Owner"
                          ? "primary"
                          : r === "Accountant"
                            ? "success"
                            : "default"
                      }
                      size="sm"
                      label={r}
                    />
                  ))}
                </View>
              </View>
            ))}
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}
