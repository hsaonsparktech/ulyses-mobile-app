import { useState } from "react";
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { DocumentCard } from "@/components/ui/DocumentCard";
import { SvgIcon } from "@/components/ui/SvgIcon";
import { ReceiptZoomModal } from "@/features/scanning/components/ReceiptZoomModal";
import { ScanFailedModal } from "@/features/scanning/components/ScanFailedModal";
import { ScanProcessingModal } from "@/features/scanning/components/ScanProcessingModal";
import { ScanReviewModal } from "@/features/scanning/components/ScanReviewModal";
import { ScanSourceModal } from "@/features/scanning/components/ScanSourceModal";
import { StatementReviewModal } from "@/features/scanning/components/StatementReviewModal";
import { useScanStore } from "@/features/scanning/store";
import { DocumentArchiveModal } from "../components/DocumentArchiveModal";
import { DocumentCalendarModal } from "../components/DocumentCalendarModal";
import { DocumentDetailModal } from "../components/DocumentDetailModal";
import { FolderContentsModal } from "../components/FolderContentsModal";
import { useDocumentStore } from "../store";
import type { DocumentItem } from "../types";

export function DocumentsScreen() {
  const documents = useDocumentStore((s) => s.documents);
  const openScanSource = useScanStore((s) => s.openScanSource);

  // Filters & State
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<
    "All" | "Receipts" | "Invoices" | "Statements" | "Needs Review"
  >("All");

  // Modal States
  const [selectedDoc, setSelectedDoc] = useState<DocumentItem | null>(null);
  const [selectedFolder, setSelectedFolder] = useState<
    "Receipts" | "Invoices" | "Statements" | null
  >(null);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [archiveOpen, setArchiveOpen] = useState(false);

  // Active (non-archived) documents
  const activeDocs = documents.filter((d) => !d.archived);

  // Counts
  const receiptCount = activeDocs.filter((d) => d.folder === "Receipts").length;
  const invoiceCount = activeDocs.filter((d) => d.folder === "Invoices").length;
  const statementCount = activeDocs.filter(
    (d) => d.folder === "Statements",
  ).length;
  const reviewCount = activeDocs.filter(
    (d) => d.status === "Needs Review",
  ).length;

  // Filtered documents
  const filteredDocs = activeDocs.filter((doc) => {
    // Filter chip match
    if (activeFilter === "Receipts" && doc.folder !== "Receipts") return false;
    if (activeFilter === "Invoices" && doc.folder !== "Invoices") return false;
    if (activeFilter === "Statements" && doc.folder !== "Statements")
      return false;
    if (activeFilter === "Needs Review" && doc.status !== "Needs Review")
      return false;

    // Search query match
    if (searchQuery.trim().length > 0) {
      const q = searchQuery.toLowerCase();
      const matchName = doc.filename.toLowerCase().includes(q);
      const matchVendor = doc.vendorOrClient?.toLowerCase().includes(q);
      const matchCategory = doc.category?.toLowerCase().includes(q);
      return matchName || matchVendor || matchCategory;
    }

    return true;
  });

  return (
    <View className="flex-1 bg-surface-primary">
      {/* Top Header Bar */}
      <View className="px-6 pt-12 pb-4 bg-surface-primary border-b border-border-subtle">
        <View className="flex-row items-center justify-between mb-3">
          <View>
            <Text className="text-2xl font-bold text-content-primary">
              Documents
            </Text>
            <Text className="text-xs text-content-secondary mt-0.5">
              Figma Frame 36:890 · {activeDocs.length} Active Files
            </Text>
          </View>

          {/* Action icons */}
          <View className="flex-row items-center space-x-2">
            <Pressable
              onPress={() => setCalendarOpen(true)}
              className="w-10 h-10 rounded-full bg-surface-secondary items-center justify-center border border-border-subtle"
              accessibilityLabel="Open document calendar"
            >
              <SvgIcon name="calendar" size={18} color="#374151" />
            </Pressable>

            <Pressable
              onPress={() => setArchiveOpen(true)}
              className="w-10 h-10 rounded-full bg-surface-secondary items-center justify-center border border-border-subtle"
              accessibilityLabel="Open document archive"
            >
              <SvgIcon name="archive" size={18} color="#374151" />
            </Pressable>

            <Pressable
              onPress={openScanSource}
              className="px-3.5 h-10 rounded-full bg-brand-primary flex-row items-center justify-center"
              accessibilityLabel="Smart scan receipt"
            >
              <SvgIcon name="camera" size={16} color="#FFFFFF" />
              <Text className="text-xs font-semibold text-white ml-1.5">
                Scan
              </Text>
            </Pressable>
          </View>
        </View>

        {/* Search input */}
        <View className="flex-row items-center bg-surface-secondary px-3.5 py-2.5 rounded-xl border border-border-subtle">
          <SvgIcon name="search" size={16} color="#9CA3AF" />
          <TextInput
            className="flex-1 ml-2 text-sm text-content-primary"
            placeholder="Search documents by name, vendor, category..."
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

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 60 }}
      >
        {/* Folders Section */}
        <View className="px-6 pt-5 pb-3">
          <Text className="text-xs font-bold text-content-secondary uppercase tracking-wider mb-3">
            Folders
          </Text>

          <View className="flex-row space-x-3">
            {/* Receipts Folder */}
            <Pressable
              onPress={() => setSelectedFolder("Receipts")}
              className="flex-1 p-3.5 rounded-2xl bg-surface-secondary border border-border-subtle active:bg-surface-tertiary"
              accessibilityLabel={`Receipts folder, ${receiptCount} files`}
            >
              <View className="w-8 h-8 rounded-lg bg-brand-primary/10 items-center justify-center mb-2">
                <SvgIcon name="shopping-bag" size={16} color="#1570EF" />
              </View>
              <Text className="text-sm font-bold text-content-primary">
                Receipts
              </Text>
              <Text className="text-xs text-content-secondary mt-0.5">
                {receiptCount} files
              </Text>
            </Pressable>

            {/* Invoices Folder */}
            <Pressable
              onPress={() => setSelectedFolder("Invoices")}
              className="flex-1 p-3.5 rounded-2xl bg-surface-secondary border border-border-subtle active:bg-surface-tertiary"
              accessibilityLabel={`Invoices folder, ${invoiceCount} files`}
            >
              <View className="w-8 h-8 rounded-lg bg-accent-purple/10 items-center justify-center mb-2">
                <SvgIcon name="file-text" size={16} color="#7C3AED" />
              </View>
              <Text className="text-sm font-bold text-content-primary">
                Invoices
              </Text>
              <Text className="text-xs text-content-secondary mt-0.5">
                {invoiceCount} files
              </Text>
            </Pressable>

            {/* Statements Folder */}
            <Pressable
              onPress={() => setSelectedFolder("Statements")}
              className="flex-1 p-3.5 rounded-2xl bg-surface-secondary border border-border-subtle active:bg-surface-tertiary"
              accessibilityLabel={`Statements folder, ${statementCount} files`}
            >
              <View className="w-8 h-8 rounded-lg bg-feedback-warning/10 items-center justify-center mb-2">
                <SvgIcon name="credit-card" size={16} color="#D97706" />
              </View>
              <Text className="text-sm font-bold text-content-primary">
                Statements
              </Text>
              <Text className="text-xs text-content-secondary mt-0.5">
                {statementCount} files
              </Text>
            </Pressable>
          </View>
        </View>

        {/* Filter Pills */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="px-6 py-2"
          contentContainerStyle={{ paddingRight: 24 }}
        >
          {(
            [
              { key: "All", label: `All (${activeDocs.length})` },
              { key: "Receipts", label: `Receipts (${receiptCount})` },
              { key: "Invoices", label: `Invoices (${invoiceCount})` },
              { key: "Statements", label: `Statements (${statementCount})` },
              { key: "Needs Review", label: `Needs Review (${reviewCount})` },
            ] as const
          ).map((tab) => {
            const isSelected = activeFilter === tab.key;
            return (
              <Pressable
                key={tab.key}
                onPress={() => setActiveFilter(tab.key)}
                className={`mr-2 px-3.5 py-1.5 rounded-full border ${
                  isSelected
                    ? "bg-brand-primary border-brand-primary"
                    : "bg-surface-secondary border-border-subtle"
                }`}
                accessibilityLabel={`Filter by ${tab.key}`}
              >
                <Text
                  className={`text-xs font-semibold ${
                    isSelected ? "text-white" : "text-content-secondary"
                  }`}
                >
                  {tab.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* Documents List */}
        <View className="px-6 pt-3">
          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-xs font-bold text-content-secondary uppercase tracking-wider">
              {activeFilter === "All"
                ? "Recent Documents"
                : `${activeFilter} List`}{" "}
              ({filteredDocs.length})
            </Text>
          </View>

          {filteredDocs.length === 0 ? (
            <View className="items-center justify-center py-12 bg-surface-secondary rounded-2xl border border-border-subtle p-6">
              <SvgIcon name="file" size={32} color="#9CA3AF" />
              <Text className="text-sm font-bold text-content-primary mt-3">
                No matching documents
              </Text>
              <Text className="text-xs text-content-secondary text-center mt-1">
                Try adjusting your search query or filters.
              </Text>
            </View>
          ) : (
            <View className="space-y-3">
              {filteredDocs.map((doc) => (
                <DocumentCard
                  key={doc.id}
                  filename={doc.filename}
                  type={doc.type}
                  fileTypeLabel={doc.fileTypeLabel}
                  date={doc.date}
                  status={doc.status}
                  onPress={() => setSelectedDoc(doc)}
                />
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Modals */}
      <DocumentDetailModal
        document={selectedDoc}
        visible={!!selectedDoc}
        onClose={() => setSelectedDoc(null)}
      />

      <FolderContentsModal
        folder={selectedFolder}
        documents={documents}
        visible={!!selectedFolder}
        onClose={() => setSelectedFolder(null)}
        onSelectDocument={(doc) => {
          setSelectedFolder(null);
          setSelectedDoc(doc);
        }}
      />

      <DocumentCalendarModal
        documents={activeDocs}
        visible={calendarOpen}
        onClose={() => setCalendarOpen(false)}
        onSelectDocument={(doc) => {
          setCalendarOpen(false);
          setSelectedDoc(doc);
        }}
      />

      <DocumentArchiveModal
        visible={archiveOpen}
        onClose={() => setArchiveOpen(false)}
        onSelectDocument={(doc) => {
          setArchiveOpen(false);
          setSelectedDoc(doc);
        }}
      />

      {/* Scanning Modals */}
      <ScanSourceModal />
      <ScanProcessingModal />
      <ScanReviewModal />
      <ReceiptZoomModal />
      <StatementReviewModal />
      <ScanFailedModal />
    </View>
  );
}
