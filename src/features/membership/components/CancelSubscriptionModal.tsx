import { useState } from "react";
import { Modal, Pressable, ScrollView, Text, View } from "react-native";
import { SvgIcon } from "@/components/ui/SvgIcon";
import { FullDataExportModal } from "./FullDataExportModal";

interface CancelSubscriptionModalProps {
  visible: boolean;
  onClose: () => void;
}

export function CancelSubscriptionModal({
  visible,
  onClose,
}: CancelSubscriptionModalProps) {
  const [exportOpen, setExportOpen] = useState(false);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View
        className="flex-1 bg-[#f6f8fb]"
        accessibilityLabel="Cancel subscription screen"
      >
        {/* Header */}
        <View className="flex-row items-center justify-between px-6 pt-6 pb-4 border-b border-[#dce4ee] bg-white">
          <View>
            <Text className="text-[22px] font-semibold text-[#13243c] leading-[30px]">
              Cancel subscription
            </Text>
            <Text className="text-xs text-[#52657c] leading-[16px] mt-0.5">
              Review cancellation and export terms
            </Text>
          </View>
          <Pressable
            onPress={onClose}
            className="w-9 h-9 rounded-full bg-[#eef3fa] items-center justify-center"
            accessibilityLabel="Close cancellation modal"
          >
            <SvgIcon name="x" size={20} color="#13243c" />
          </Pressable>
        </View>

        <ScrollView
          className="flex-1 px-5 pt-4"
          contentContainerStyle={{ paddingBottom: 110 }}
        >
          {/* Card / Record summary */}
          <View className="bg-white border border-[#dce4ee] rounded-[13px] p-4 mb-3">
            <Text className="text-xs font-semibold text-[#52657c] uppercase tracking-wider mb-2">
              CANCELLATION · PREVIEW
            </Text>
            <Text className="text-lg font-semibold text-[#13243c] leading-[26px]">
              Cancel anytime · no refunds
            </Text>
          </View>

          {/* Card / Retention */}
          <View className="bg-white border border-[#dce4ee] rounded-[13px] px-4 py-3.5 flex-row items-center justify-between mb-3">
            <Text className="text-xs text-[#52657c] w-32">Read-only data</Text>
            <Text className="text-sm font-medium text-[#13243c] flex-1 text-right">
              60–90 days
            </Text>
          </View>

          {/* Card / Grace period */}
          <View className="bg-white border border-[#dce4ee] rounded-[13px] px-4 py-3.5 flex-row items-center justify-between mb-3">
            <Text className="text-xs text-[#52657c] w-32">Full export</Text>
            <Text className="text-sm font-medium text-[#13243c] flex-1 text-right">
              30 days
            </Text>
          </View>

          {/* Card / Notice */}
          <View className="bg-white border border-[#dce4ee] rounded-[13px] px-4 py-3.5 flex-row items-center justify-between mb-3">
            <Text className="text-xs text-[#52657c] w-32">Refunds</Text>
            <Text className="text-sm font-medium text-[#13243c] flex-1 text-right">
              Not available
            </Text>
          </View>

          {/* Card / Policy status */}
          <View className="bg-white border border-[#dce4ee] rounded-[13px] px-4 py-3.5 flex-row items-center justify-between mb-4">
            <Text className="text-xs text-[#52657c] w-32">Access cutoff</Text>
            <Text className="text-sm font-medium text-[#13243c] flex-1 text-right">
              Awaiting approval
            </Text>
          </View>

          {/* Card / Note */}
          <View className="bg-white border border-[#dce4ee] rounded-[13px] p-3.5 mb-4">
            <Text className="text-xs text-[#52657c] leading-[18px]">
              Next-cycle service cutoff needs clarification. No live
              cancellation occurs in this preview.
            </Text>
          </View>
        </ScrollView>

        {/* Fixed Bottom Action Row */}
        <View className="absolute bottom-0 left-0 right-0 bg-white border-t border-[#dce4ee] px-5 py-4 flex-row space-x-3">
          <Pressable
            onPress={onClose}
            className="flex-1 h-12 rounded-[12px] bg-white border border-[#dce4ee] items-center justify-center"
            accessibilityLabel="Review terms"
          >
            <Text className="text-sm font-semibold text-[#13243c]">
              Review terms
            </Text>
          </Pressable>

          <Pressable
            onPress={() => setExportOpen(true)}
            className="flex-1 h-12 rounded-[12px] bg-[#2459d8] items-center justify-center"
            accessibilityLabel="Export data"
          >
            <Text className="text-sm font-semibold text-white">
              Export data
            </Text>
          </Pressable>
        </View>

        {/* Export Modal Child */}
        <FullDataExportModal
          visible={exportOpen}
          onClose={() => setExportOpen(false)}
        />
      </View>
    </Modal>
  );
}
