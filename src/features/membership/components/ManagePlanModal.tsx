import { useState } from "react";
import { Alert, Modal, Pressable, ScrollView, Text, View } from "react-native";
import { SvgIcon } from "@/components/ui/SvgIcon";
import { useMembershipStore } from "../store";
import type { BillingCycle } from "../types";
import { CancelSubscriptionModal } from "./CancelSubscriptionModal";

interface ManagePlanModalProps {
  visible: boolean;
  onClose: () => void;
}

export function ManagePlanModal({ visible, onClose }: ManagePlanModalProps) {
  const { subscription, setCycle } = useMembershipStore();
  const [selectedCycle, setSelectedCycle] = useState<BillingCycle>(
    subscription.cycle,
  );
  const [cancelOpen, setCancelOpen] = useState(false);

  const handleSaveCycle = () => {
    if (selectedCycle !== subscription.cycle) {
      setCycle(selectedCycle);
      Alert.alert(
        "Plan Updated",
        `Your billing cycle has been changed to ${selectedCycle}.`,
        [{ text: "OK" }],
      );
    }
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View
        className="flex-1 bg-[#f6f8fb]"
        accessibilityLabel="Manage plan screen"
      >
        {/* Header */}
        <View className="flex-row items-center justify-between px-6 pt-6 pb-4 border-b border-[#dce4ee] bg-white">
          <View>
            <Text className="text-[22px] font-semibold text-[#13243c] leading-[30px]">
              Manage plan
            </Text>
            <Text className="text-xs text-[#52657c] leading-[16px] mt-0.5">
              Choose annual billing or update your subscription
            </Text>
          </View>
          <Pressable
            onPress={onClose}
            className="w-9 h-9 rounded-full bg-[#eef3fa] items-center justify-center"
            accessibilityLabel="Close manage plan modal"
          >
            <SvgIcon name="x" size={20} color="#13243c" />
          </Pressable>
        </View>

        <ScrollView
          className="flex-1 px-5 pt-4"
          contentContainerStyle={{ paddingBottom: 110 }}
        >
          {/* Card / Annual plan */}
          <Pressable
            onPress={() => setSelectedCycle("annual")}
            className={`border rounded-[13px] p-4 mb-3 ${
              selectedCycle === "annual"
                ? "bg-[#eaf1ff] border-[#2459d8]"
                : "bg-white border-[#dce4ee]"
            }`}
            accessibilityLabel="Select annual plan"
          >
            <View className="flex-row items-center justify-between mb-1.5">
              <View className="flex-row items-center space-x-2">
                <Text className="text-sm font-semibold text-[#13243c]">
                  Annual plan · save $40/yr
                </Text>
              </View>
              <View
                className={`w-5 h-5 rounded-full border items-center justify-center ${
                  selectedCycle === "annual"
                    ? "border-[#2459d8] bg-[#2459d8]"
                    : "border-[#dce4ee] bg-white"
                }`}
              >
                {selectedCycle === "annual" && (
                  <View className="w-2 h-2 rounded-full bg-white" />
                )}
              </View>
            </View>
            <Text className="text-base font-semibold text-[#13243c]">
              $200/yr · billed annually
            </Text>
            <Text className="text-xs text-[#52657c] mt-0.5">
              Equivalent to $16.67/mo (2 months free)
            </Text>
          </Pressable>

          {/* Card / Monthly plan */}
          <Pressable
            onPress={() => setSelectedCycle("monthly")}
            className={`border rounded-[13px] p-4 mb-3 ${
              selectedCycle === "monthly"
                ? "bg-[#eaf1ff] border-[#2459d8]"
                : "bg-white border-[#dce4ee]"
            }`}
            accessibilityLabel="Select monthly plan"
          >
            <View className="flex-row items-center justify-between mb-1.5">
              <Text className="text-sm font-semibold text-[#13243c]">
                Monthly plan
              </Text>
              <View
                className={`w-5 h-5 rounded-full border items-center justify-center ${
                  selectedCycle === "monthly"
                    ? "border-[#2459d8] bg-[#2459d8]"
                    : "border-[#dce4ee] bg-white"
                }`}
              >
                {selectedCycle === "monthly" && (
                  <View className="w-2 h-2 rounded-full bg-white" />
                )}
              </View>
            </View>
            <Text className="text-base font-semibold text-[#13243c]">
              $20/mo
            </Text>
            <Text className="text-xs text-[#52657c] mt-0.5">
              Flexible standard monthly billing
            </Text>
          </Pressable>

          {/* Card / Multi-business */}
          <View className="bg-white border border-[#dce4ee] rounded-[13px] p-4 mb-3">
            <Text className="text-sm font-semibold text-[#13243c] mb-1">
              Multi-business plan
            </Text>
            <Text className="text-xs text-[#52657c] leading-[18px]">
              Add secondary businesses at $15/mo each with consolidated
              accountant access and unified reporting.
            </Text>
          </View>

          {/* Card / Next billing date */}
          <View className="bg-white border border-[#dce4ee] rounded-[13px] px-4 py-3.5 flex-row items-center justify-between mb-4">
            <Text className="text-sm text-[#52657c]">Next billing date</Text>
            <Text className="text-sm font-semibold text-[#13243c]">
              {subscription.nextBillingDate}
            </Text>
          </View>
        </ScrollView>

        {/* Fixed Bottom Action Row */}
        <View className="absolute bottom-0 left-0 right-0 bg-white border-t border-[#dce4ee] px-5 py-4 flex-row space-x-3">
          <Pressable
            onPress={() => setCancelOpen(true)}
            className="flex-1 h-12 rounded-[12px] bg-white border border-[#bc3c48] items-center justify-center"
            accessibilityLabel="Cancel subscription action"
          >
            <Text className="text-sm font-semibold text-[#bc3c48]">
              Cancel subscription
            </Text>
          </Pressable>

          <Pressable
            onPress={handleSaveCycle}
            className="flex-1 h-12 rounded-[12px] bg-[#2459d8] items-center justify-center"
            accessibilityLabel="Change billing cycle"
          >
            <Text className="text-sm font-semibold text-white">
              Change billing cycle
            </Text>
          </Pressable>
        </View>

        {/* Cancel Modal Child */}
        <CancelSubscriptionModal
          visible={cancelOpen}
          onClose={() => setCancelOpen(false)}
        />
      </View>
    </Modal>
  );
}
