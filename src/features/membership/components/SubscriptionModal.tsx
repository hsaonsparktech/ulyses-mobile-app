import { useState } from "react";
import { Modal, Pressable, ScrollView, Text, View } from "react-native";
import { SvgIcon } from "@/components/ui/SvgIcon";
import { useMembershipStore } from "../store";
import { ManagePlanModal } from "./ManagePlanModal";

interface SubscriptionModalProps {
  visible: boolean;
  onClose: () => void;
}

export function SubscriptionModal({
  visible,
  onClose,
}: SubscriptionModalProps) {
  const { subscription } = useMembershipStore();
  const [manageOpen, setManageOpen] = useState(false);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View
        className="flex-1 bg-[#f6f8fb]"
        accessibilityLabel="Subscription settings screen"
      >
        {/* Header */}
        <View className="flex-row items-center justify-between px-6 pt-6 pb-4 border-b border-[#dce4ee] bg-white">
          <View>
            <Text className="text-[22px] font-semibold text-[#13243c] leading-[30px]">
              Subscription
            </Text>
            <Text className="text-xs text-[#52657c] leading-[16px] mt-0.5">
              Active plan and renewal settings
            </Text>
          </View>
          <Pressable
            onPress={onClose}
            className="w-9 h-9 rounded-full bg-[#eef3fa] items-center justify-center"
            accessibilityLabel="Close subscription modal"
          >
            <SvgIcon name="x" size={20} color="#13243c" />
          </Pressable>
        </View>

        <ScrollView
          className="flex-1 px-5 pt-4"
          contentContainerStyle={{ paddingBottom: 110 }}
        >
          {/* Card / Active Plan Details */}
          <View className="bg-white border border-[#dce4ee] rounded-[13px] p-5 mb-4 shadow-sm">
            <View className="flex-row items-center justify-between mb-2">
              <Text className="text-xs font-semibold text-[#52657c] tracking-wider uppercase">
                Plan · {subscription.planName}
              </Text>
              <View className="px-2.5 py-1 rounded-full bg-[#e5f6ed] border border-[#70d7a1]">
                <Text className="text-[11px] font-semibold text-[#137754]">
                  {subscription.status.toUpperCase()}
                </Text>
              </View>
            </View>

            <View className="flex-row items-baseline space-x-1.5 my-1">
              <Text className="text-3xl font-bold text-[#13243c]">
                {subscription.priceFormatted}
              </Text>
              <Text className="text-xs text-[#52657c]">
                {subscription.cycle === "annual"
                  ? "(billed annually)"
                  : "(billed monthly)"}
              </Text>
            </View>

            <Text className="text-xs text-[#52657c] mt-1">
              Renews {subscription.renewalDate}
            </Text>
          </View>

          {/* Card / Included Features */}
          <View className="bg-white border border-[#dce4ee] rounded-[13px] p-4 mb-4">
            <Text className="text-sm font-semibold text-[#13243c] mb-3">
              Included with your subscription
            </Text>

            <View className="space-y-2.5">
              <View className="flex-row items-center space-x-2.5">
                <SvgIcon name="check-circle" size={16} color="#2459d8" />
                <Text className="text-xs font-medium text-[#13243c]">
                  Unlimited invoices, estimates, and client billing
                </Text>
              </View>

              <View className="flex-row items-center space-x-2.5">
                <SvgIcon name="check-circle" size={16} color="#2459d8" />
                <Text className="text-xs font-medium text-[#13243c]">
                  Smart receipt scanning & OCR auto-reconciliation
                </Text>
              </View>

              <View className="flex-row items-center space-x-2.5">
                <SvgIcon name="check-circle" size={16} color="#2459d8" />
                <Text className="text-xs font-medium text-[#13243c]">
                  Libros AI financial assistant & tax classification
                </Text>
              </View>

              <View className="flex-row items-center space-x-2.5">
                <SvgIcon name="check-circle" size={16} color="#2459d8" />
                <Text className="text-xs font-medium text-[#13243c]">
                  Multi-seat team and accountant workspace access
                </Text>
              </View>

              <View className="flex-row items-center space-x-2.5">
                <SvgIcon name="check-circle" size={16} color="#2459d8" />
                <Text className="text-xs font-medium text-[#13243c]">
                  30-day full export window on plan changes
                </Text>
              </View>
            </View>
          </View>

          {/* Card / Retention Policy */}
          <View className="bg-white border border-[#dce4ee] rounded-[13px] p-4 mb-4">
            <View className="flex-row items-center space-x-2 mb-1.5">
              <SvgIcon name="shield" size={16} color="#52657c" />
              <Text className="text-xs font-semibold text-[#13243c] uppercase tracking-wider">
                Data Retention & Export
              </Text>
            </View>
            <Text className="text-xs text-[#52657c] leading-[18px]">
              Business data is securely retained for 60–90 days in read-only
              mode after cancellation. Complete export in PDF, CSV, and JSON is
              guaranteed during your 30-day window.
            </Text>
          </View>
        </ScrollView>

        {/* Fixed Bottom Action Row */}
        <View className="absolute bottom-0 left-0 right-0 bg-white border-t border-[#dce4ee] px-5 py-4 flex-row space-x-3">
          <Pressable
            onPress={onClose}
            className="flex-1 h-12 rounded-[12px] bg-white border border-[#dce4ee] items-center justify-center"
            accessibilityLabel="Close subscription details"
          >
            <Text className="text-sm font-semibold text-[#13243c]">Close</Text>
          </Pressable>

          <Pressable
            onPress={() => setManageOpen(true)}
            className="flex-1 h-12 rounded-[12px] bg-[#2459d8] items-center justify-center"
            accessibilityLabel="Manage plan"
          >
            <Text className="text-sm font-semibold text-white">
              Manage plan
            </Text>
          </Pressable>
        </View>

        {/* Manage Plan Modal Child */}
        <ManagePlanModal
          visible={manageOpen}
          onClose={() => setManageOpen(false)}
        />
      </View>
    </Modal>
  );
}
