import { Modal, ScrollView, View } from "react-native";
import { Button } from "@/components/ui/Button";
import { DocumentCard } from "@/components/ui/DocumentCard";
import { Text } from "@/components/ui/Text";
import type { DocumentItem } from "../types";

export interface FolderContentsModalProps {
  folder: "Receipts" | "Invoices" | "Statements" | null;
  documents: DocumentItem[];
  visible: boolean;
  onClose: () => void;
  onSelectDocument: (doc: DocumentItem) => void;
}

export function FolderContentsModal({
  folder,
  documents,
  visible,
  onClose,
  onSelectDocument,
}: FolderContentsModalProps) {
  if (!folder) return null;

  const folderDocs = documents.filter(
    (d) => d.folder === folder && !d.archived,
  );

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
          {/* Header Figma 81:898 */}
          <View className="mb-4">
            <Text variant="Title" className="font-semibold text-text">
              {folder}
            </Text>
            <Text variant="Caption" tone="muted" className="mt-1">
              {folderDocs.length}{" "}
              {folderDocs.length === 1 ? "document" : "documents"} in this
              folder
            </Text>
          </View>

          {/* List of documents */}
          <View className="gap-3 mb-6">
            {folderDocs.map((doc) => (
              <DocumentCard
                key={doc.id}
                filename={doc.filename}
                type={doc.type}
                status={doc.status}
                date={doc.date}
                fileTypeLabel={doc.fileTypeLabel}
                onPress={() => onSelectDocument(doc)}
              />
            ))}

            {folderDocs.length === 0 && (
              <View className="rounded-[14px] border border-border bg-surface p-6 items-center">
                <Text variant="Body" tone="muted">
                  No documents found in {folder}.
                </Text>
              </View>
            )}
          </View>

          <Button
            title="Back to documents"
            variant="secondary"
            onPress={onClose}
          />
        </ScrollView>
      </View>
    </Modal>
  );
}
