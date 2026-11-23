import { useState } from "react";
import { Alert, Modal, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Badge } from "@/components/ui/Badge";
import { SvgIcon } from "@/components/ui/SvgIcon";
import { useTeamStore } from "../store";
import type { TeamMember } from "../types";
import { InviteMemberModal } from "./InviteMemberModal";
import { RolePermissionsModal } from "./RolePermissionsModal";

interface TeamModalProps {
  visible: boolean;
  onClose: () => void;
}

export function TeamModal({ visible, onClose }: TeamModalProps) {
  const members = useTeamStore((s) => s.members);
  const revokeMember = useTeamStore((s) => s.revokeMember);

  const [inviteOpen, setInviteOpen] = useState(false);
  const [permissionsOpen, setPermissionsOpen] = useState(false);

  const handleRevoke = (member: TeamMember) => {
    if (member.role === "Owner") {
      Alert.alert("Action Blocked", "Business Owner access cannot be revoked.");
      return;
    }

    Alert.alert(
      "Revoke Team Access",
      `Are you sure you want to revoke system access for ${member.name}? They will immediately lose access to all Acme Services LLC records.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Revoke Access",
          style: "destructive",
          onPress: () => revokeMember(member.id),
        },
      ],
    );
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
            <View className="w-10 h-10 rounded-full bg-primary/10 items-center justify-center">
              <SvgIcon name="users" size={20} color="#1570EF" />
            </View>
            <View collapsable={false}>
              <Text
                className="text-xl font-bold text-text"
                accessibilityRole="header"
              >
                Team Access
              </Text>
              <Text className="text-xs text-textMuted">
                Figma Frame 37:830 · {members.length} Members
              </Text>
            </View>
          </View>
          <Pressable
            onPress={onClose}
            className="w-9 h-9 rounded-full bg-surface border border-border items-center justify-center min-h-[44px] min-w-[44px]"
            accessibilityRole="button"
            accessibilityLabel="Close team modal"
            collapsable={false}
          >
            <SvgIcon name="x" size={20} color="#6B7280" />
          </Pressable>
        </View>

        <ScrollView
          className="flex-1 px-6 py-4"
          contentContainerStyle={{ paddingBottom: 40 }}
        >
          {/* Quick buttons */}
          <View className="flex-row space-x-3 mb-6">
            <Pressable
              onPress={() => setInviteOpen(true)}
              className="flex-1 py-3 px-4 rounded-xl bg-brand-primary flex-row items-center justify-center active:bg-brand-primary/90"
              accessibilityLabel="Invite team member"
            >
              <SvgIcon name="user-plus" size={16} color="#FFFFFF" />
              <Text className="text-xs font-bold text-white ml-2">
                Invite Member
              </Text>
            </Pressable>

            <Pressable
              onPress={() => setPermissionsOpen(true)}
              className="py-3 px-4 rounded-xl bg-surface-secondary border border-border-subtle flex-row items-center justify-center active:bg-surface-tertiary"
              accessibilityLabel="View role permissions"
            >
              <SvgIcon name="shield" size={16} color="#4B5563" />
              <Text className="text-xs font-bold text-content-primary ml-2">
                Permissions
              </Text>
            </Pressable>
          </View>

          {/* Members List */}
          <Text className="text-xs font-bold text-content-secondary uppercase tracking-wider mb-3">
            Active Members ({members.length})
          </Text>

          <View className="space-y-3 mb-6">
            {members.map((member) => (
              <View
                key={member.id}
                className="p-4 rounded-2xl bg-surface-secondary border border-border-subtle flex-row items-center justify-between"
              >
                <View className="flex-row items-center space-x-3 flex-1 mr-3">
                  <View
                    className="w-10 h-10 rounded-full items-center justify-center"
                    style={{
                      backgroundColor: `${member.avatarColor || "#1570EF"}20`,
                    }}
                  >
                    <Text
                      className="text-sm font-bold"
                      style={{ color: member.avatarColor || "#1570EF" }}
                    >
                      {member.name.slice(0, 2).toUpperCase()}
                    </Text>
                  </View>

                  <View className="flex-1">
                    <View className="flex-row items-center space-x-2">
                      <Text
                        className="text-sm font-bold text-content-primary"
                        numberOfLines={1}
                      >
                        {member.name}
                      </Text>
                      {member.status === "Pending" && (
                        <Badge variant="warning" size="sm" label="Pending" />
                      )}
                    </View>
                    <Text
                      className="text-xs text-content-secondary mt-0.5"
                      numberOfLines={1}
                    >
                      {member.email}
                    </Text>
                  </View>
                </View>

                <View className="items-end space-y-1.5">
                  <Badge
                    variant={
                      member.role === "Owner"
                        ? "primary"
                        : member.role === "Accountant"
                          ? "success"
                          : "default"
                    }
                    size="sm"
                    label={member.role}
                  />

                  {member.role !== "Owner" && (
                    <Pressable
                      onPress={() => handleRevoke(member)}
                      className="px-2 py-0.5 rounded bg-feedback-danger/10"
                      accessibilityLabel={`Revoke access for ${member.name}`}
                    >
                      <Text className="text-[10px] font-semibold text-feedback-danger">
                        Revoke
                      </Text>
                    </Pressable>
                  )}
                </View>
              </View>
            ))}
          </View>

          {/* Pro+ Policy Gated Card (D01-D03 Preview) */}
          <View className="p-4 rounded-2xl bg-surface-secondary border border-border-subtle">
            <View className="flex-row items-center justify-between mb-2">
              <View className="flex-row items-center space-x-2">
                <SvgIcon name="zap" size={16} color="#D97706" />
                <Text className="text-sm font-bold text-content-primary">
                  Pro+ Multi-Entity Access
                </Text>
              </View>
              <Badge variant="warning" size="sm" label="Provisional (D01)" />
            </View>
            <Text className="text-xs text-content-secondary leading-4 mb-3">
              Multi-entity cross-billing and automated payroll permissions are
              provisional pending client sign-off on open decisions D01–D03.
            </Text>
            <View className="px-3 py-1.5 rounded-lg bg-surface-tertiary self-start">
              <Text className="text-[11px] font-medium text-content-secondary">
                Preview Only · Billing inactive
              </Text>
            </View>
          </View>
        </ScrollView>

        {/* Sub-modals */}
        <InviteMemberModal
          visible={inviteOpen}
          onClose={() => setInviteOpen(false)}
        />
        <RolePermissionsModal
          visible={permissionsOpen}
          onClose={() => setPermissionsOpen(false)}
        />
      </SafeAreaView>
    </Modal>
  );
}
