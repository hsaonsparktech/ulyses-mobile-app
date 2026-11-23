import { useState } from "react";
import { Alert, Modal, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { SvgIcon } from "@/components/ui/SvgIcon";
import { useAccountantStore } from "../store";
import type { AccountantDocument } from "../types";

interface AccountantDocumentDetailModalProps {
  document: AccountantDocument | null;
  visible: boolean;
  onClose: () => void;
}

export function AccountantDocumentDetailModal({
  document,
  visible,
  onClose,
}: AccountantDocumentDetailModalProps) {
  const markReconciled = useAccountantStore((s) => s.markDocumentReconciled);
  const [isZoomed, setIsZoomed] = useState(false);

  if (!document) return null;

  const handleDownload = () => {
    Alert.alert(
      "Download Started",
      `Saved ${document.filename} (${document.fileSize}) to device storage.`,
      [{ text: "OK" }],
    );
  };

  const handleMarkReconciled = () => {
    markReconciled(document.id);
    Alert.alert(
      "Status Updated",
      "Document marked as Reconciled for client accounting records.",
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
                Accounting Record
              </Text>
              <Text className="text-xs text-textMuted">
                Figma Frame 41:455 · Document Detail
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
          {/* Document Header Card */}
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
              <Badge
                variant={
                  document.status === "Reconciled"
                    ? "success"
                    : document.status === "Needs Review"
                      ? "warning"
                      : "default"
                }
                size="sm"
                label={document.status}
              />
            </View>
          </View>

          {/* First-page preview Figma 218:449 */}
          <View className="bg-surface-secondary rounded-2xl p-4 border border-border-subtle mb-5">
            <View className="flex-row items-center justify-between mb-3">
              <Text className="text-xs font-bold text-content-secondary uppercase tracking-wider">
                DOCUMENT PREVIEW · {isZoomed ? "ZOOM 150%" : "FIRST PAGE"}
              </Text>
              <Pressable
                onPress={() => setIsZoomed(!isZoomed)}
                className="flex-row items-center space-x-1"
                accessibilityLabel="Toggle preview zoom"
              >
                <SvgIcon name="search" size={12} color="#1570EF" />
                <Text className="text-xs font-semibold text-brand-primary">
                  {isZoomed ? "Reset" : "Zoom"}
                </Text>
              </Pressable>
            </View>

            {/* Mock Page Preview Canvas */}
            <View
              className={`bg-white rounded-xl border border-gray-200 p-4 shadow-sm ${
                isZoomed ? "h-64" : "h-44"
              } justify-between`}
            >
              <View>
                <View className="flex-row justify-between items-center pb-2 border-b border-gray-100">
                  <Text className="text-xs font-bold text-gray-800">
                    {document.vendorOrClient}
                  </Text>
                  <Text className="text-[10px] text-gray-500">
                    {document.period ?? "FY 2026"}
                  </Text>
                </View>
                <View className="pt-2 space-y-1">
                  <Text className="text-[11px] text-gray-700">
                    Document Ref: {document.id.toUpperCase()}
                  </Text>
                  <Text className="text-[11px] text-gray-600">
                    Category: {document.type}
                  </Text>
                  {document.amount && (
                    <Text className="text-xs font-bold text-gray-900 mt-1">
                      Posted Total: ${document.amount.toLocaleString()}
                    </Text>
                  )}
                </View>
              </View>

              <View className="pt-2 border-t border-gray-100 flex-row justify-between items-center">
                <Text className="text-[9px] text-gray-400">
                  Official Record · Verified by Libros Engine
                </Text>
                <Text className="text-[9px] font-bold text-emerald-600">
                  {document.status}
                </Text>
              </View>
            </View>
          </View>

          {/* Metadata Breakdown */}
          <View className="bg-surface-secondary rounded-2xl p-4 border border-border-subtle mb-6 space-y-3">
            <View className="flex-row justify-between py-1.5 border-b border-border-subtle/50">
              <Text className="text-sm text-content-secondary">Type</Text>
              <Text className="text-sm font-semibold text-content-primary">
                {document.type}
              </Text>
            </View>

            <View className="flex-row justify-between py-1.5 border-b border-border-subtle/50">
              <Text className="text-sm text-content-secondary">
                Associated Party
              </Text>
              <Text className="text-sm font-semibold text-content-primary">
                {document.vendorOrClient}
              </Text>
            </View>

            <View className="flex-row justify-between py-1.5 border-b border-border-subtle/50">
              <Text className="text-sm text-content-secondary">Date</Text>
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

            {document.amount && (
              <View className="flex-row justify-between py-1.5">
                <Text className="text-sm text-content-secondary">
                  Ledger Amount
                </Text>
                <Text className="text-sm font-bold text-brand-primary">
                  ${document.amount.toLocaleString()}
                </Text>
              </View>
            )}
          </View>

          {/* Action Buttons */}
          <View className="space-y-3">
            {document.status === "Needs Review" && (
              <Button
                variant="secondary"
                onPress={handleMarkReconciled}
                title="Confirm Reconciled"
              />
            )}
            <Button
              variant="primary"
              onPress={handleDownload}
              title="Download Document"
            />
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}
