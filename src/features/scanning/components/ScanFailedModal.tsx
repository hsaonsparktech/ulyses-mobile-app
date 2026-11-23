import { Modal, Text, View } from "react-native";
import { Button } from "@/components/ui/Button";
import { SvgIcon } from "@/components/ui/SvgIcon";
import { useScanStore } from "../store";

export function ScanFailedModal() {
  const isOpen = useScanStore((s) => s.failedModalOpen);
  const setFailedModalOpen = useScanStore((s) => s.setFailedModalOpen);
  const openScanSource = useScanStore((s) => s.openScanSource);
  const currentScan = useScanStore((s) => s.currentScan);

  if (!isOpen) return null;

  const handleRetry = () => {
    setFailedModalOpen(false);
    openScanSource();
  };

  const handleClose = () => {
    setFailedModalOpen(false);
  };

  return (
    <Modal
      visible={isOpen}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <View className="flex-1 bg-black/60 items-center justify-center px-6">
        <View className="w-full max-w-sm bg-surface-primary rounded-3xl p-6 shadow-2xl border border-border-subtle items-center">
          <View className="w-16 h-16 rounded-full bg-feedback-danger/10 items-center justify-center mb-4">
            <SvgIcon name="alert-triangle" size={30} color="#EF4444" />
          </View>

          <Text className="text-xl font-bold text-content-primary mb-2 text-center">
            Scan Unsuccessful
          </Text>
          <Text className="text-xs text-content-secondary mb-1 text-center font-semibold">
            Figma Frame 81:1386 · OCR Error Recovery
          </Text>

          <Text className="text-sm text-content-secondary text-center mb-6 leading-5">
            {currentScan?.errorMessage ||
              "Unable to read text clearly. Please avoid glare, shadows, or crumpled paper and retake with proper lighting."}
          </Text>

          <View className="w-full space-y-3">
            <Button
              variant="primary"
              title="Try Again"
              onPress={handleRetry}
              accessibilityLabel="Retry scanning document"
            />
            <Button
              variant="secondary"
              title="Cancel"
              onPress={handleClose}
              accessibilityLabel="Cancel scan"
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}
