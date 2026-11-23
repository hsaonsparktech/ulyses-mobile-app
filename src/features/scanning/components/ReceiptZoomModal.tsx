import { useState } from "react";
import { Modal, Pressable, ScrollView, Text, View } from "react-native";
import { SvgIcon } from "@/components/ui/SvgIcon";
import { useScanStore } from "../store";

export function ReceiptZoomModal() {
  const isOpen = useScanStore((s) => s.zoomModalOpen);
  const setZoomModalOpen = useScanStore((s) => s.setZoomModalOpen);
  const [selectedBox, setSelectedBox] = useState<string | null>("vendor");

  if (!isOpen) return null;

  return (
    <Modal
      visible={isOpen}
      animationType="fade"
      transparent={false}
      onRequestClose={() => setZoomModalOpen(false)}
    >
      <View className="flex-1 bg-black">
        {/* Top bar */}
        <View className="flex-row items-center justify-between px-6 pt-12 pb-4 bg-black/80 z-20">
          <Pressable
            onPress={() => setZoomModalOpen(false)}
            className="w-10 h-10 rounded-full bg-white/20 items-center justify-center min-h-[44px] min-w-[44px]"
            accessibilityRole="button"
            accessibilityLabel="Close receipt zoom"
            collapsable={false}
          >
            <SvgIcon name="arrow-left" size={20} color="#FFFFFF" />
          </Pressable>
          <View className="items-center">
            <Text className="text-base font-bold text-white">
              Receipt OCR Inspector
            </Text>
            <Text className="text-xs text-white/70">
              Figma Frame 216:907 · 4 Bounding Boxes
            </Text>
          </View>
          <View className="w-10 h-10" />
        </View>

        {/* Receipt Canvas representation with OCR Bounding Boxes */}
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ alignItems: "center", paddingVertical: 20 }}
          maximumZoomScale={3}
          minimumZoomScale={1}
        >
          <View className="w-80 bg-white rounded-lg p-6 shadow-2xl relative border border-gray-300">
            {/* Paper header */}
            <View className="items-center border-b border-dashed border-gray-400 pb-4 mb-4">
              <Text className="font-mono text-xs text-gray-500 uppercase tracking-widest">
                OFFICE DEPOT STORE #1428
              </Text>
              <Text className="font-mono text-xs text-gray-400 mt-1">
                SAN FRANCISCO, CA 94107
              </Text>

              {/* Vendor OCR bounding box */}
              <Pressable
                onPress={() => setSelectedBox("vendor")}
                className={`mt-2 px-2 py-1 rounded border-2 ${
                  selectedBox === "vendor"
                    ? "border-brand-primary bg-brand-primary/10"
                    : "border-green-500 bg-green-500/10"
                }`}
              >
                <Text className="font-mono text-xs font-bold text-gray-900">
                  OFFICE DEPOT
                </Text>
                <View className="absolute -top-3 -right-2 bg-brand-primary px-1 rounded">
                  <Text className="text-[9px] text-white font-bold">
                    99% OCR
                  </Text>
                </View>
              </Pressable>
            </View>

            {/* Date bounding box */}
            <Pressable
              onPress={() => setSelectedBox("date")}
              className={`mb-4 px-2 py-1 rounded border-2 ${
                selectedBox === "date"
                  ? "border-brand-primary bg-brand-primary/10"
                  : "border-green-500 bg-green-500/10"
              }`}
            >
              <Text className="font-mono text-xs text-gray-600">
                DATE: 11/04/2026 14:22 PST
              </Text>
              <View className="absolute -top-3 -right-2 bg-green-600 px-1 rounded">
                <Text className="text-[9px] text-white font-bold">98% OCR</Text>
              </View>
            </Pressable>

            {/* Line items bounding box */}
            <Pressable
              onPress={() => setSelectedBox("items")}
              className={`mb-4 p-2 rounded border-2 ${
                selectedBox === "items"
                  ? "border-brand-primary bg-brand-primary/10"
                  : "border-green-500 bg-green-500/10"
              }`}
            >
              <View className="flex-row justify-between mb-1">
                <Text className="font-mono text-xs text-gray-800">
                  Copy Paper 5-ream
                </Text>
                <Text className="font-mono text-xs text-gray-800">$48.50</Text>
              </View>
              <View className="flex-row justify-between mb-1">
                <Text className="font-mono text-xs text-gray-800">
                  Gel Ink Pens 12pk
                </Text>
                <Text className="font-mono text-xs text-gray-800">$18.99</Text>
              </View>
              <View className="flex-row justify-between">
                <Text className="font-mono text-xs text-gray-800">
                  Wireless Mouse M310
                </Text>
                <Text className="font-mono text-xs text-gray-800">$57.01</Text>
              </View>
              <View className="absolute -top-3 -right-2 bg-green-600 px-1 rounded">
                <Text className="text-[9px] text-white font-bold">97% OCR</Text>
              </View>
            </Pressable>

            {/* Total bounding box */}
            <Pressable
              onPress={() => setSelectedBox("total")}
              className={`pt-2 border-t border-dashed border-gray-400 p-2 rounded border-2 ${
                selectedBox === "total"
                  ? "border-brand-primary bg-brand-primary/10"
                  : "border-green-500 bg-green-500/10"
              }`}
            >
              <View className="flex-row justify-between mb-1">
                <Text className="font-mono text-xs text-gray-500">
                  SUBTOTAL
                </Text>
                <Text className="font-mono text-xs text-gray-700">$124.50</Text>
              </View>
              <View className="flex-row justify-between mb-1">
                <Text className="font-mono text-xs text-gray-500">
                  SALES TAX (9.0%)
                </Text>
                <Text className="font-mono text-xs text-gray-700">$11.20</Text>
              </View>
              <View className="flex-row justify-between mt-1">
                <Text className="font-mono text-sm font-bold text-gray-900">
                  TOTAL
                </Text>
                <Text className="font-mono text-sm font-bold text-gray-900">
                  $135.70
                </Text>
              </View>
              <View className="absolute -top-3 -right-2 bg-brand-primary px-1 rounded">
                <Text className="text-[9px] text-white font-bold">99% OCR</Text>
              </View>
            </Pressable>

            <View className="items-center mt-6">
              <Text className="font-mono text-[10px] text-gray-400">
                AUTH CODE: 092817 · VISA *9912
              </Text>
            </View>
          </View>
        </ScrollView>

        {/* Selected Box Info Drawer */}
        <View className="bg-surface-primary px-6 py-4 border-t border-border-subtle">
          <View className="flex-row items-center justify-between mb-1">
            <Text className="text-xs font-bold text-content-secondary uppercase">
              Selected OCR Region
            </Text>
            <Text className="text-xs font-semibold text-feedback-success">
              Engine: Google Vision OCR v3
            </Text>
          </View>
          <Text className="text-sm font-bold text-content-primary mb-2">
            {selectedBox === "vendor" &&
              "Merchant: Office Depot (Confidence: 99%)"}
            {selectedBox === "date" &&
              "Date: 2026-11-04 14:22 PST (Confidence: 98%)"}
            {selectedBox === "items" &&
              "Items: 3 products extracted (Confidence: 97%)"}
            {selectedBox === "total" &&
              "Total: $135.70 USD verified (Confidence: 99%)"}
          </Text>
          <Pressable
            onPress={() => setZoomModalOpen(false)}
            className="w-full py-2.5 rounded-xl bg-brand-primary items-center"
            accessibilityLabel="Return to review"
          >
            <Text className="text-sm font-semibold text-white">
              Back to Review Form
            </Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}
