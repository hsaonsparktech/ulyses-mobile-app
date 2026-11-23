import { useState } from "react";
import { Alert, Pressable, ScrollView, Text, View } from "react-native";
import { Button } from "@/components/ui/Button";
import { DocumentCard } from "@/components/ui/DocumentCard";
import { LibrosLogo } from "@/components/ui/LibrosLogo";
import { SvgIcon } from "@/components/ui/SvgIcon";
import { EmployeeDocumentDetailModal } from "../components/EmployeeDocumentDetailModal";
import { useEmployeeStore } from "../store";
import type { EmployeeDocument } from "../types";

export function EmployeeDocumentsScreen() {
  const documents = useEmployeeStore((s) => s.documents);
  const addDocument = useEmployeeStore((s) => s.addDocument);

  const [activeCategory, setActiveCategory] = useState<string>("All");
  const [selectedDoc, setSelectedDoc] = useState<EmployeeDocument | null>(null);

  const categories = ["All", "Receipt", "Statement", "Policy"];

  const filteredDocs =
    activeCategory === "All"
      ? documents
      : documents.filter((d) => d.type === activeCategory);

  const handleUploadNew = () => {
    const timestamp = Date.now();
    addDocument({
      filename: `Receipt_Emp_${timestamp.toString().slice(-4)}.pdf`,
      type: "Receipt",
      date: new Date().toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      }),
      fileSize: "1.8 MB",
      fileTypeLabel: "PDF",
      category: "Travel & Fuel",
      vendorOrClient: "Shell Oil",
      status: "Ready",
    });
    Alert.alert(
      "Document Uploaded",
      "Your receipt has been added to employee documents.",
    );
  };

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

          {/* Role Badge Figma 165:73 */}
          <View className="flex-row items-center bg-brand-primary/10 px-3 py-1.5 rounded-full space-x-1.5 border border-brand-primary/20">
            <SvgIcon name="user" size={14} color="#1570EF" />
            <Text className="text-xs font-bold text-brand-primary tracking-wider">
              EMPLOYEE
            </Text>
          </View>
        </View>
      </View>

      <ScrollView
        className="flex-1 px-6 py-5"
        contentContainerStyle={{ paddingBottom: 60 }}
      >
        {/* Title */}
        <View className="flex-row items-center justify-between mb-4">
          <View>
            <Text className="text-2xl font-bold text-content-primary">
              Documents
            </Text>
            <Text className="text-xs text-content-secondary mt-0.5">
              Figma Frame 41:152 · Employee Documents
            </Text>
          </View>
          <Button
            variant="secondary"
            onPress={handleUploadNew}
            title="+ Upload"
          />
        </View>

        {/* Filter Card Figma 41:164 */}
        <View className="bg-surface-secondary rounded-2xl p-4 border border-border-subtle mb-5">
          <Text className="text-xs font-bold text-content-secondary uppercase tracking-wider mb-2.5">
            Filter by type
          </Text>
          <View className="flex-row flex-wrap gap-2">
            {categories.map((cat) => {
              const isSelected = activeCategory === cat;
              return (
                <Pressable
                  key={cat}
                  onPress={() => setActiveCategory(cat)}
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
        <Text className="text-base font-bold text-content-primary mb-3">
          Available files ({filteredDocs.length})
        </Text>

        {filteredDocs.length === 0 ? (
          <View className="bg-surface-secondary rounded-2xl p-8 border border-border-subtle items-center justify-center">
            <SvgIcon name="file-text" size={36} color="#9CA3AF" />
            <Text className="text-sm font-semibold text-content-primary mt-3">
              No documents found
            </Text>
            <Text className="text-xs text-content-secondary text-center mt-1">
              No files match the "{activeCategory}" filter category.
            </Text>
          </View>
        ) : (
          <View className="space-y-3">
            {filteredDocs.map((doc) => (
              <DocumentCard
                key={doc.id}
                filename={doc.filename}
                type={doc.type === "Policy" ? "Statement" : doc.type}
                status={doc.status}
                date={doc.date}
                fileTypeLabel={doc.fileTypeLabel}
                onPress={() => setSelectedDoc(doc)}
              />
            ))}
          </View>
        )}
      </ScrollView>

      {/* Detail Modal */}
      <EmployeeDocumentDetailModal
        document={selectedDoc}
        visible={!!selectedDoc}
        onClose={() => setSelectedDoc(null)}
      />
    </View>
  );
}
