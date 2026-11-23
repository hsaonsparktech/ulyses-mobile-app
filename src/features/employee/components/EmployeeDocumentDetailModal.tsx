import { Alert, Modal, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { SvgIcon } from "@/components/ui/SvgIcon";
import type { EmployeeDocument } from "../types";

interface EmployeeDocumentDetailModalProps {
  document: EmployeeDocument | null;
  visible: boolean;
  onClose: () => void;
}

export function EmployeeDocumentDetailModal({
  document,
  visible,
  onClose,
}: EmployeeDocumentDetailModalProps) {
  if (!document) return null;

  const handleDownload = () => {
    Alert.alert(
      "Download Started",
      `Saved ${document.filename} (${document.fileSize}) to your device downloads folder.`,
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
      <SafeAreaView className="flex-1 bg-surface" edges={["top", "bottom"]}>
        {/* Header */}
        <View className="flex-row items-center justify-between px-6 pt-2 pb-4 border-b border-border bg-surface">
          <View className="flex-row items-center space-x-3">
            <View className="w-10 h-10 rounded-full bg-primary/10 items-center justify-center">
              <SvgIcon name="file-text" size={20} color="#1570EF" />
            </View>
            <View collapsable={false}>
              <Text
                className="text-xl font-bold text-text"
                accessibilityRole="header"
              >
                Document Details
              </Text>
              <Text className="text-xs text-textMuted">
                Figma Frame 84:89 · Employee Document
              </Text>
            </View>
          </View>
          <Pressable
            onPress={onClose}
            className="w-9 h-9 rounded-full bg-surface border border-border items-center justify-center min-h-[44px] min-w-[44px]"
            accessibilityRole="button"
            accessibilityLabel="Close document detail"
            collapsable={false}
          >
            <SvgIcon name="x" size={20} color="#6B7280" />
          </Pressable>
        </View>

        <ScrollView
          className="flex-1 px-6 py-4"
          contentContainerStyle={{ paddingBottom: 40 }}
        >
          {/* File Card Preview */}
          <View className="bg-surface-secondary rounded-2xl p-5 border border-border-subtle mb-5 items-center">
            <View className="w-16 h-16 rounded-2xl bg-brand-primary/10 items-center justify-center mb-3">
              <SvgIcon name="file-text" size={32} color="#1570EF" />
            </View>
            <Text
              className="text-base font-bold text-content-primary text-center"
              numberOfLines={2}
            >
              {document.filename}
            </Text>
            <View className="flex-row items-center space-x-2 mt-2">
              <Badge
                variant="primary"
                size="sm"
                label={document.fileTypeLabel}
              />
              <Badge variant="success" size="sm" label={document.status} />
            </View>
          </View>

          {/* Metadata */}
          <View className="bg-surface-secondary rounded-2xl p-4 border border-border-subtle mb-6 space-y-3">
            <View className="flex-row justify-between py-1.5 border-b border-border-subtle/50">
              <Text className="text-sm text-content-secondary">Type</Text>
              <Text className="text-sm font-semibold text-content-primary">
                {document.type}
              </Text>
            </View>

            <View className="flex-row justify-between py-1.5 border-b border-border-subtle/50">
              <Text className="text-sm text-content-secondary">
                Upload Date
              </Text>
              <Text className="text-sm font-semibold text-content-primary">
                {document.date}, 2026
              </Text>
            </View>

            <View className="flex-row justify-between py-1.5 border-b border-border-subtle/50">
              <Text className="text-sm text-content-secondary">File Size</Text>
              <Text className="text-sm font-semibold text-content-primary">
                {document.fileSize}
              </Text>
            </View>

            <View className="flex-row justify-between py-1.5">
              <Text className="text-sm text-content-secondary">Category</Text>
              <Text className="text-sm font-semibold text-content-primary">
                {document.category}
              </Text>
            </View>
          </View>

          {/* Actions */}
          <View className="space-y-3">
            <Button
              variant="primary"
              title="Download File"
              onPress={handleDownload}
              accessibilityLabel="Download document file"
            />
            <Button
              variant="secondary"
              title="Close"
              onPress={onClose}
              accessibilityLabel="Close modal"
            />
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}
