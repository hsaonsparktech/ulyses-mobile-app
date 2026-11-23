import { useState } from "react";
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { SvgIcon } from "@/components/ui/SvgIcon";
import { useDocumentStore } from "@/features/documents/store";
import { useScanStore } from "../store";

export function ScanReviewModal() {
  const isOpen = useScanStore((s) => s.reviewModalOpen);
  const currentScan = useScanStore((s) => s.currentScan);
  const setReviewModalOpen = useScanStore((s) => s.setReviewModalOpen);
  const setZoomModalOpen = useScanStore((s) => s.setZoomModalOpen);
  const openScanSource = useScanStore((s) => s.openScanSource);
  const addDocument = useDocumentStore((s) => s.addDocument);

  const [vendor, setVendor] = useState(currentScan?.vendor || "Office Depot");
  const [date, setDate] = useState(currentScan?.date || "2026-11-04");
  const [category, setCategory] = useState(
    currentScan?.category || "Office Supplies",
  );
  const [total, setTotal] = useState(
    currentScan?.total ? String(currentScan.total) : "135.70",
  );

  if (!isOpen || !currentScan) return null;

  const handleConfirm = () => {
    // Add to verified documents
    addDocument({
      businessId: "biz-1",
      filename: `Receipt_${vendor.replace(/\s+/g, "")}_${date}.jpg`,
      type: "Receipt",
      status: "Ready",
      date,
      fileTypeLabel: "JPG",
      fileSize: "1.4 MB",
      folder: "Receipts",
      vendorOrClient: vendor,
      totalAmount: parseFloat(total) || 135.7,
      category,
    });

    setReviewModalOpen(false);
    Alert.alert(
      "Document Saved",
      `Successfully confirmed and recorded ${vendor} ($${total}) into your documents.`,
      [{ text: "OK" }],
    );
  };

  const handleRetake = () => {
    setReviewModalOpen(false);
    openScanSource();
  };

  return (
    <Modal
      visible={isOpen}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={() => setReviewModalOpen(false)}
    >
      <SafeAreaView className="flex-1 bg-surface" edges={["top", "bottom"]}>
        {/* Header */}
        <View className="flex-row items-center justify-between px-6 pt-2 pb-4 border-b border-border bg-surface">
          <View className="flex-row items-center space-x-3">
            <View className="w-10 h-10 rounded-full bg-primary/10 items-center justify-center">
              <SvgIcon name="check-circle" size={20} color="#1570EF" />
            </View>
            <View collapsable={false}>
              <Text
                className="text-xl font-bold text-text"
                accessibilityRole="header"
              >
                Review Extracted Scan
              </Text>
              <Text className="text-xs text-textMuted">
                Figma Frame 36:781 · AI Extraction Review
              </Text>
            </View>
          </View>
          <Pressable
            onPress={() => setReviewModalOpen(false)}
            className="w-9 h-9 rounded-full bg-surface border border-border items-center justify-center min-h-[44px] min-w-[44px]"
            accessibilityRole="button"
            accessibilityLabel="Close scan review"
            collapsable={false}
          >
            <SvgIcon name="x" size={20} color="#6B7280" />
          </Pressable>
        </View>

        <ScrollView
          className="flex-1 px-6 py-4"
          contentContainerStyle={{ paddingBottom: 40 }}
        >
          {/* Receipt thumbnail & OCR Zoom trigger */}
          <View className="bg-surface-secondary rounded-2xl p-4 border border-border-subtle mb-6">
            <View className="flex-row items-center justify-between mb-3">
              <View className="flex-row items-center space-x-2">
                <SvgIcon name="file-text" size={16} color="#6B7280" />
                <Text className="text-xs font-semibold text-content-secondary uppercase tracking-wider">
                  Source Image & OCR
                </Text>
              </View>
              <Badge variant="success" size="sm" label="98% Confidence" />
            </View>

            <View className="bg-surface-tertiary rounded-xl p-4 flex-row items-center justify-between">
              <View className="flex-1 mr-3">
                <Text
                  className="text-sm font-semibold text-content-primary"
                  numberOfLines={1}
                >
                  {currentScan.fileName}
                </Text>
                <Text className="text-xs text-content-secondary mt-0.5">
                  1040 x 1800 px · High resolution OCR pass
                </Text>
              </View>
              <Pressable
                onPress={() => setZoomModalOpen(true)}
                className="px-3 py-2 rounded-xl bg-brand-primary flex-row items-center"
                accessibilityLabel="Zoom receipt OCR annotation"
              >
                <SvgIcon name="maximize-2" size={14} color="#FFFFFF" />
                <Text className="text-xs font-semibold text-white ml-1.5">
                  Inspect OCR
                </Text>
              </Pressable>
            </View>
          </View>

          {/* AI extraction fields */}
          <Text className="text-sm font-bold text-content-primary mb-3">
            Extracted Transaction Fields
          </Text>

          <View className="space-y-4 mb-6">
            <View>
              <Text className="text-xs font-semibold text-content-secondary mb-1">
                Merchant / Vendor
              </Text>
              <TextInput
                className="w-full bg-surface-secondary border border-border-subtle rounded-xl px-4 py-3 text-sm text-content-primary font-medium"
                value={vendor}
                onChangeText={setVendor}
                placeholder="Vendor Name"
              />
            </View>

            <View className="flex-row space-x-3">
              <View className="flex-1">
                <Text className="text-xs font-semibold text-content-secondary mb-1">
                  Transaction Date
                </Text>
                <TextInput
                  className="w-full bg-surface-secondary border border-border-subtle rounded-xl px-4 py-3 text-sm text-content-primary font-medium"
                  value={date}
                  onChangeText={setDate}
                  placeholder="YYYY-MM-DD"
                />
              </View>

              <View className="flex-1">
                <Text className="text-xs font-semibold text-content-secondary mb-1">
                  Category
                </Text>
                <TextInput
                  className="w-full bg-surface-secondary border border-border-subtle rounded-xl px-4 py-3 text-sm text-content-primary font-medium"
                  value={category}
                  onChangeText={setCategory}
                  placeholder="Category"
                />
              </View>
            </View>

            <View>
              <Text className="text-xs font-semibold text-content-secondary mb-1">
                Total Amount ($ USD)
              </Text>
              <TextInput
                className="w-full bg-surface-secondary border border-border-subtle rounded-xl px-4 py-3 text-base text-content-primary font-bold"
                value={total}
                onChangeText={setTotal}
                keyboardType="decimal-pad"
                placeholder="0.00"
              />
            </View>
          </View>

          {/* AI Disclaimer Callout */}
          <View className="bg-brand-primary/5 border border-brand-primary/20 rounded-2xl p-4 mb-6 flex-row items-start space-x-3">
            <SvgIcon name="shield" size={18} color="#1570EF" />
            <View className="flex-1">
              <Text className="text-xs font-semibold text-brand-primary mb-0.5">
                Libros AI Financial Protection
              </Text>
              <Text className="text-xs text-content-secondary leading-4">
                Extracted data is never finalized without explicit business
                owner confirmation. Tax calculations follow IRS accounting
                rules.
              </Text>
            </View>
          </View>

          {/* Actions */}
          <View className="space-y-3">
            <Button
              variant="primary"
              title="Confirm & Save to Records"
              onPress={handleConfirm}
              accessibilityLabel="Confirm and save document to records"
            />
            <Button
              variant="secondary"
              title="Retake / Re-upload"
              onPress={handleRetake}
              accessibilityLabel="Retake or re-upload document"
            />
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}
