import { useState } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { DocumentCard } from "@/components/ui/DocumentCard";
import { SvgIcon } from "@/components/ui/SvgIcon";
import { useDocumentStore } from "../store";
import type { DocumentItem } from "../types";

interface DocumentArchiveModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectDocument: (doc: DocumentItem) => void;
}

export function DocumentArchiveModal({
  visible,
  onClose,
  onSelectDocument,
}: DocumentArchiveModalProps) {
  const documents = useDocumentStore((s) => s.documents);
  const unarchiveDocument = useDocumentStore((s) => s.unarchiveDocument);
  const [searchQuery, setSearchQuery] = useState("");

  const archivedDocs = documents.filter(
    (d) =>
      d.archived &&
      (d.filename.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.vendorOrClient?.toLowerCase().includes(searchQuery.toLowerCase())),
  );

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
            <View className="w-10 h-10 rounded-full bg-surface border border-border items-center justify-center">
              <SvgIcon name="archive" size={20} color="#6B7280" />
            </View>
            <View collapsable={false}>
              <Text
                className="text-xl font-bold text-text"
                accessibilityRole="header"
              >
                Archived Documents
              </Text>
              <Text className="text-xs text-textMuted">
                {archivedDocs.length} archived{" "}
                {archivedDocs.length === 1 ? "item" : "items"}
              </Text>
            </View>
          </View>
          <Pressable
            onPress={onClose}
            className="w-9 h-9 rounded-full bg-surface border border-border items-center justify-center min-h-[44px] min-w-[44px]"
            accessibilityRole="button"
            accessibilityLabel="Close archived documents"
            collapsable={false}
          >
            <SvgIcon name="x" size={20} color="#6B7280" />
          </Pressable>
        </View>

        {/* Search */}
        <View className="px-6 py-3 bg-surface-primary">
          <View className="flex-row items-center bg-surface-secondary px-3 py-2 rounded-xl border border-border-subtle">
            <SvgIcon name="search" size={16} color="#9CA3AF" />
            <TextInput
              className="flex-1 ml-2 text-sm text-content-primary"
              placeholder="Search archive..."
              placeholderTextColor="#9CA3AF"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <Pressable onPress={() => setSearchQuery("")}>
                <SvgIcon name="x-circle" size={16} color="#9CA3AF" />
              </Pressable>
            )}
          </View>
        </View>

        {/* Document list */}
        <ScrollView
          className="flex-1 px-6 py-2"
          contentContainerStyle={{ paddingBottom: 40 }}
        >
          {archivedDocs.length === 0 ? (
            <View className="items-center justify-center py-16">
              <View className="w-16 h-16 rounded-full bg-surface-secondary items-center justify-center mb-4">
                <SvgIcon name="archive" size={28} color="#9CA3AF" />
              </View>
              <Text className="text-base font-semibold text-content-primary mb-1">
                No archived documents
              </Text>
              <Text className="text-sm text-content-secondary text-center max-w-xs">
                Documents archived from the hub will appear here and can be
                restored at any time.
              </Text>
            </View>
          ) : (
            <View className="space-y-3">
              {archivedDocs.map((doc) => (
                <View key={doc.id} className="relative">
                  <DocumentCard
                    filename={doc.filename}
                    type={doc.type}
                    fileTypeLabel={doc.fileTypeLabel}
                    date={doc.date}
                    status={doc.status}
                    onPress={() => onSelectDocument(doc)}
                  />
                  <Pressable
                    onPress={() => unarchiveDocument(doc.id)}
                    className="absolute right-4 bottom-4 px-3 py-1.5 rounded-lg bg-surface-secondary border border-border-subtle flex-row items-center"
                    accessibilityLabel={`Restore ${doc.filename}`}
                  >
                    <SvgIcon name="rotate-ccw" size={12} color="#4B5563" />
                    <Text className="text-xs font-medium text-content-secondary ml-1.5">
                      Restore
                    </Text>
                  </Pressable>
                </View>
              ))}
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}
