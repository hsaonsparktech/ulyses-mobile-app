import { Alert, Modal, ScrollView, View } from "react-native";
import { Button } from "@/components/ui/Button";
import { Text } from "@/components/ui/Text";
import { useDocumentStore } from "../store";
import type { DocumentItem } from "../types";

export interface DocumentDetailModalProps {
  document: DocumentItem | null;
  visible: boolean;
  onClose: () => void;
  onOpenZoom?: (doc: DocumentItem) => void;
}

export function DocumentDetailModal({
  document,
  visible,
  onClose,
  onOpenZoom,
}: DocumentDetailModalProps) {
  const archiveDocument = useDocumentStore((s) => s.archiveDocument);
  const unarchiveDocument = useDocumentStore((s) => s.unarchiveDocument);

  if (!document) return null;

  const handleDownload = () => {
    Alert.alert(
      "Download Document",
      `Saved ${document.filename} to local device storage.`,
      [{ text: "OK" }],
    );
  };

  const handleToggleArchive = () => {
    if (document.archived) {
      unarchiveDocument(document.id);
      Alert.alert("Restored", "Document restored from archive.");
    } else {
      archiveDocument(document.id);
      Alert.alert("Archived", "Document moved to archive.");
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
      <View className="flex-1 bg-canvas">
        <ScrollView
          className="flex-1 px-4 pt-6"
          contentContainerStyle={{ paddingBottom: 50 }}
        >
          {/* Header Figma 81:946 */}
          <View className="mb-4">
            <Text variant="Title" className="font-semibold text-text">
              Document details
            </Text>
            <Text variant="Caption" tone="muted" className="mt-1">
              {document.folder} · {document.fileSize} · {document.fileTypeLabel}
            </Text>
          </View>

          {/* Document Preview Snapshot Card */}
          <View className="mb-4 rounded-[14px] border border-border bg-surface p-5 shadow-sm">
            <View className="mb-3 flex-row items-center justify-between">
              <View className="rounded-[8px] bg-surfaceAlt px-3 py-1.5">
                <Text
                  variant="Caption"
                  tone="primary"
                  className="font-semibold"
                >
                  {document.fileTypeLabel}
                </Text>
              </View>
              <View className="rounded-[6px] bg-primarySoft px-2.5 py-1">
                <Text variant="Caption" tone="primary">
                  {document.status}
                </Text>
              </View>
            </View>

            <Text
              variant="Heading"
              className="text-[18px] font-semibold text-text"
            >
              {document.filename}
            </Text>

            {document.vendorOrClient ? (
              <Text variant="Body" className="mt-1 font-medium text-text">
                {document.vendorOrClient}
              </Text>
            ) : null}

            {document.totalAmount ? (
              <Text
                variant="Display"
                className="mt-2 text-[24px] font-bold text-text"
              >
                ${document.totalAmount.toFixed(2)}
              </Text>
            ) : null}

            <View className="my-3 h-px bg-border" />

            <View className="gap-1.5">
              <View className="flex-row justify-between">
                <Text variant="Caption" tone="muted">
                  Extracted date
                </Text>
                <Text variant="Caption" className="font-medium text-text">
                  {document.extractedDate ?? document.date}
                </Text>
              </View>

              {document.category ? (
                <View className="flex-row justify-between">
                  <Text variant="Caption" tone="muted">
                    Category
                  </Text>
                  <Text variant="Caption" className="font-medium text-text">
                    {document.category}
                  </Text>
                </View>
              ) : null}

              {document.notes ? (
                <View className="mt-1 rounded bg-surfaceAlt p-2.5">
                  <Text variant="Caption" tone="muted">
                    Notes: {document.notes}
                  </Text>
                </View>
              ) : null}
            </View>
          </View>

          {/* OCR Zoom shortcut button if receipt */}
          {document.type === "Receipt" && onOpenZoom ? (
            <View className="mb-4">
              <Button
                title="View OCR receipt zoom"
                variant="secondary"
                onPress={() => {
                  onClose();
                  onOpenZoom(document);
                }}
              />
            </View>
          ) : null}

          {/* Action Toolbar */}
          <View className="gap-3">
            <View className="flex-row gap-3">
              <View className="flex-1">
                <Button
                  title="Download file"
                  variant="primary"
                  onPress={handleDownload}
                />
              </View>
              <View className="flex-1">
                <Button
                  title={document.archived ? "Restore" : "Archive"}
                  variant="secondary"
                  onPress={handleToggleArchive}
                />
              </View>
            </View>

            <Button title="Close" variant="secondary" onPress={onClose} />
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}
