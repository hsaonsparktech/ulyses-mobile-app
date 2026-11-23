import { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { DocumentCard } from "@/components/ui/DocumentCard";
import { LibrosLogo } from "@/components/ui/LibrosLogo";
import { SvgIcon } from "@/components/ui/SvgIcon";
import { AccountantDocumentDetailModal } from "../components/AccountantDocumentDetailModal";
import { useAccountantStore } from "../store";
import type { AccountantDocument } from "../types";

export function AccountantDocumentsScreen() {
  const documents = useAccountantStore((s) => s.documents);
  const activeFilter = useAccountantStore((s) => s.activeDocumentFilter);
  const setActiveFilter = useAccountantStore((s) => s.setActiveDocumentFilter);

  const [selectedDoc, setSelectedDoc] = useState<AccountantDocument | null>(
    null,
  );

  const categories = ["All", "Statement", "Tax Filing", "Invoice", "Receipt"];

  const filteredDocs =
    activeFilter === "All"
      ? documents
      : documents.filter((d) => d.type === activeFilter);

  return (
    <View className="flex-1 bg-surface-primary">
      {/* Header Bar */}
      <View className="px-6 pt-12 pb-4 bg-surface-primary border-b border-border-subtle">
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center space-x-2.5">
            <LibrosLogo variant="compact" width={22} height={15.98} />
            <Text className="text-xl font-bold text-content-primary">
              Libros
            </Text>
          </View>

          {/* Role Badge Figma 166:71 */}
          <View className="flex-row items-center bg-brand-primary/10 px-3 py-1.5 rounded-full space-x-1.5 border border-brand-primary/20">
            <SvgIcon name="dollar-sign" size={14} color="#1570EF" />
            <Text className="text-xs font-bold text-brand-primary tracking-wider">
              ACCOUNTANT
            </Text>
          </View>
        </View>
      </View>

      <ScrollView
        className="flex-1 px-6 py-5"
        contentContainerStyle={{ paddingBottom: 60 }}
      >
        {/* Title */}
        <View className="mb-4">
          <Text className="text-2xl font-bold text-content-primary">
            Documents
          </Text>
          <Text className="text-xs text-content-secondary mt-0.5">
            Figma Frame 41:425 · Read-Only Client Records
          </Text>
        </View>

        {/* Filter Card Figma 41:431 */}
        <View className="bg-surface-secondary rounded-2xl p-4 border border-border-subtle mb-5">
          <Text className="text-xs font-bold text-content-secondary uppercase tracking-wider mb-2.5">
            Filter by classification
          </Text>
          <View className="flex-row flex-wrap gap-2">
            {categories.map((cat) => {
              const isSelected = activeFilter === cat;
              return (
                <Pressable
                  key={cat}
                  onPress={() => setActiveFilter(cat)}
                  className={`px-3.5 py-1.5 rounded-full border ${
                    isSelected
                      ? "bg-brand-primary border-brand-primary"
                      : "bg-surface-primary border-border-subtle"
                  }`}
                  accessibilityLabel={`Filter ${cat}`}
                >
                  <Text
                    className={`text-xs font-semibold ${
                      isSelected ? "text-white" : "text-content-secondary"
                    }`}
                  >
                    {cat}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Document List */}
        <View className="flex-row items-center justify-between mb-3">
          <Text className="text-base font-bold text-content-primary">
            Client files ({filteredDocs.length})
          </Text>
          <Text className="text-xs text-content-secondary">
            Verified attachments
          </Text>
        </View>

        {filteredDocs.length === 0 ? (
          <View className="bg-surface-secondary rounded-2xl p-8 border border-border-subtle items-center justify-center">
            <SvgIcon name="file-text" size={36} color="#9CA3AF" />
            <Text className="text-sm font-semibold text-content-primary mt-3">
              No documents found
            </Text>
            <Text className="text-xs text-content-secondary text-center mt-1">
              No client files match the "{activeFilter}" filter category.
            </Text>
          </View>
        ) : (
          <View className="space-y-3">
            {filteredDocs.map((doc) => (
              <DocumentCard
                key={doc.id}
                filename={doc.filename}
                type={
                  doc.type === "Tax Filing"
                    ? "Statement"
                    : (doc.type as "Receipt" | "Statement" | "Invoice")
                }
                status={`${doc.status} · ${doc.fileSize}`}
                date={doc.date}
                fileTypeLabel={doc.fileTypeLabel}
                onPress={() => setSelectedDoc(doc)}
              />
            ))}
          </View>
        )}
      </ScrollView>

      {/* Detail Modal */}
      <AccountantDocumentDetailModal
        document={selectedDoc}
        visible={!!selectedDoc}
        onClose={() => setSelectedDoc(null)}
      />
    </View>
  );
}
