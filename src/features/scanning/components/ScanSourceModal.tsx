import {
  Modal,
  Pressable,
  Text,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { SvgIcon } from "@/components/ui/SvgIcon";
import { useScanStore } from "../store";

export function ScanSourceModal() {
  const isOpen = useScanStore((s) => s.scanModalOpen);
  const close = useScanStore((s) => s.closeScanSource);
  const startScanning = useScanStore((s) => s.startScanning);

  return (
    <Modal
      visible={isOpen}
      transparent
      animationType="fade"
      onRequestClose={close}
    >
      <TouchableWithoutFeedback onPress={close}>
        <View className="flex-1 bg-black/60 justify-end">
          <TouchableWithoutFeedback>
            <View className="bg-surface-primary rounded-t-3xl px-6 pt-6 pb-10 shadow-2xl border-t border-border-subtle">
              <View className="w-12 h-1.5 bg-border-strong rounded-full self-center mb-6" />

              <View className="flex-row items-center justify-between mb-4">
                <Text className="text-xl font-bold text-content-primary">
                  Smart Scan
                </Text>
                <Pressable
                  onPress={close}
                  className="w-8 h-8 rounded-full bg-surface-secondary items-center justify-center"
                  accessibilityLabel="Close scan options"
                >
                  <SvgIcon name="x" size={18} color="#4B5563" />
                </Pressable>
              </View>

              <Text className="text-sm text-content-secondary mb-6 leading-5">
                Libros AI automatically extracts vendors, dates, line items, and
                totals with human review.
              </Text>

              <View className="space-y-3">
                {/* Camera */}
                <Pressable
                  onPress={() => startScanning("camera")}
                  className="flex-row items-center p-4 rounded-2xl bg-surface-secondary border border-border-subtle active:bg-surface-tertiary"
                  accessibilityLabel="Take photo with camera"
                >
                  <View className="w-12 h-12 rounded-xl bg-brand-primary/10 items-center justify-center mr-4">
                    <SvgIcon name="camera" size={24} color="#1570EF" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-base font-semibold text-content-primary">
                      Take Photo
                    </Text>
                    <Text className="text-xs text-content-secondary mt-0.5">
                      Use camera to capture physical receipts
                    </Text>
                  </View>
                  <SvgIcon name="chevron-right" size={20} color="#9CA3AF" />
                </Pressable>

                {/* Upload from Photo Library */}
                <Pressable
                  onPress={() => startScanning("library")}
                  className="flex-row items-center p-4 rounded-2xl bg-surface-secondary border border-border-subtle active:bg-surface-tertiary"
                  accessibilityLabel="Choose from photo library"
                >
                  <View className="w-12 h-12 rounded-xl bg-accent-purple/10 items-center justify-center mr-4">
                    <SvgIcon name="image" size={24} color="#7C3AED" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-base font-semibold text-content-primary">
                      Photo Library
                    </Text>
                    <Text className="text-xs text-content-secondary mt-0.5">
                      Select receipt screenshot or saved photo
                    </Text>
                  </View>
                  <SvgIcon name="chevron-right" size={20} color="#9CA3AF" />
                </Pressable>

                {/* Browse PDF Document */}
                <Pressable
                  onPress={() => startScanning("pdf")}
                  className="flex-row items-center p-4 rounded-2xl bg-surface-secondary border border-border-subtle active:bg-surface-tertiary"
                  accessibilityLabel="Browse PDF statement"
                >
                  <View className="w-12 h-12 rounded-xl bg-feedback-warning/10 items-center justify-center mr-4">
                    <SvgIcon name="file-text" size={24} color="#D97706" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-base font-semibold text-content-primary">
                      Browse Document / PDF
                    </Text>
                    <Text className="text-xs text-content-secondary mt-0.5">
                      Upload bank statements or multi-page invoices
                    </Text>
                  </View>
                  <SvgIcon name="chevron-right" size={20} color="#9CA3AF" />
                </Pressable>

                {/* Simulate Scan Failure option for QA */}
                <Pressable
                  onPress={() => startScanning("camera", true)}
                  className="flex-row items-center px-4 py-2.5 rounded-xl bg-feedback-danger/5 border border-feedback-danger/20"
                  accessibilityLabel="Simulate low quality or failed scan"
                >
                  <SvgIcon name="alert-triangle" size={16} color="#EF4444" />
                  <Text className="text-xs text-feedback-danger ml-2 font-medium">
                    Test QA: Simulate unreadable / blurred capture
                  </Text>
                </Pressable>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}
