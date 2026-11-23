import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { SvgIcon } from "@/components/ui/SvgIcon";
import { useMembershipStore } from "../store";

interface FullDataExportModalProps {
  visible: boolean;
  onClose: () => void;
}

export function FullDataExportModal({
  visible,
  onClose,
}: FullDataExportModalProps) {
  const { exportConfig, isExporting, exportReady, prepareExport, resetExport } =
    useMembershipStore();

  const handleExport = async () => {
    await prepareExport();
    Alert.alert(
      "Export Complete",
      "All financial records, invoices, estimates, and documents have been bundled into a secure export archive.",
      [{ text: "OK" }],
    );
  };

  const handleClose = () => {
    resetExport();
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <View
        className="flex-1 bg-[#f6f8fb]"
        accessibilityLabel="Full data export screen"
      >
        {/* Header */}
        <View className="flex-row items-center justify-between px-6 pt-6 pb-4 border-b border-[#dce4ee] bg-white">
          <View>
            <Text className="text-[22px] font-semibold text-[#13243c] leading-[30px]">
              Export your data
            </Text>
            <Text className="text-xs text-[#52657c] leading-[16px] mt-0.5">
              Include all bookkeeping documents and records
            </Text>
          </View>
          <Pressable
            onPress={handleClose}
            className="w-9 h-9 rounded-full bg-[#eef3fa] items-center justify-center"
            accessibilityLabel="Close export modal"
          >
            <SvgIcon name="x" size={20} color="#13243c" />
          </Pressable>
        </View>

        <ScrollView
          className="flex-1 px-5 pt-4"
          contentContainerStyle={{ paddingBottom: 110 }}
        >
          {/* Field: Report */}
          <Text className="text-sm font-semibold text-[#13243c] mb-1.5 ml-1">
            Report
          </Text>
          <View className="bg-white border border-[#dce4ee] rounded-[13px] px-4 py-3.5 mb-4">
            <Text className="text-sm text-[#52657c]">
              {exportConfig.report}
            </Text>
          </View>

          {/* Field: Period */}
          <Text className="text-sm font-semibold text-[#13243c] mb-1.5 ml-1">
            Period
          </Text>
          <View className="bg-white border border-[#dce4ee] rounded-[13px] px-4 py-3.5 mb-4">
            <Text className="text-sm text-[#52657c]">
              {exportConfig.period}
            </Text>
          </View>

          {/* Field: Business */}
          <Text className="text-sm font-semibold text-[#13243c] mb-1.5 ml-1">
            Business
          </Text>
          <View className="bg-white border border-[#dce4ee] rounded-[13px] px-4 py-3.5 mb-4">
            <Text className="text-sm text-[#52657c]">
              {exportConfig.business}
            </Text>
          </View>

          {/* Field: Format */}
          <Text className="text-sm font-semibold text-[#13243c] mb-1.5 ml-1">
            Format
          </Text>
          <View className="bg-white border border-[#dce4ee] rounded-[13px] px-4 py-3.5 mb-5">
            <Text className="text-sm text-[#52657c]">
              {exportConfig.format}
            </Text>
          </View>

          {/* Export Ready Card */}
          {exportReady && (
            <View className="bg-[#e5f6ed] border border-[#70d7a1] rounded-[13px] p-4 mb-4">
              <View className="flex-row items-center space-x-2 mb-1">
                <SvgIcon name="check-circle" size={18} color="#137754" />
                <Text className="text-sm font-semibold text-[#137754]">
                  Export Bundle Ready
                </Text>
              </View>
              <Text className="text-xs text-[#1f473c]">
                Archive: {exportConfig.downloadUrl}
              </Text>
              <Text className="text-xs text-[#1f473c] mt-0.5">
                Full export preserved in local cache for immediate download.
              </Text>
            </View>
          )}

          {/* Card / Note */}
          <View className="bg-white border border-[#dce4ee] rounded-[13px] p-3.5 mb-4">
            <Text className="text-xs text-[#52657c] leading-[18px]">
              After cancellation, full export lasts 30 days. Review the
              dedicated export policy.
            </Text>
          </View>
        </ScrollView>

        {/* Fixed Bottom Action Row */}
        <View className="absolute bottom-0 left-0 right-0 bg-white border-t border-[#dce4ee] px-5 py-4 flex-row space-x-3">
          <Pressable
            onPress={handleClose}
            className="flex-1 h-12 rounded-[12px] bg-white border border-[#dce4ee] items-center justify-center"
            accessibilityLabel="Back to reports"
          >
            <Text className="text-sm font-semibold text-[#13243c]">
              Back to reports
            </Text>
          </Pressable>

          <Pressable
            onPress={handleExport}
            disabled={isExporting}
            className={`flex-1 h-12 rounded-[12px] items-center justify-center ${
              isExporting ? "bg-[#83a9ff]" : "bg-[#2459d8]"
            }`}
            accessibilityLabel="Prepare full export"
          >
            {isExporting ? (
              <ActivityIndicator color="#ffffff" size="small" />
            ) : (
              <Text className="text-sm font-semibold text-white">
                {exportReady ? "Re-prepare export" : "Prepare full export"}
              </Text>
            )}
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}
