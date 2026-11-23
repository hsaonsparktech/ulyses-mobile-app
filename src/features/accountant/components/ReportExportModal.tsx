import { useState } from "react";
import { Alert, Modal, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { SvgIcon } from "@/components/ui/SvgIcon";
import { useAccountantStore } from "../store";
import type { ReportExportConfig } from "../types";

interface ReportExportModalProps {
  visible: boolean;
  onClose: () => void;
}

export function ReportExportModal({
  visible,
  onClose,
}: ReportExportModalProps) {
  const exportReport = useAccountantStore((s) => s.exportReport);
  const isExporting = useAccountantStore((s) => s.isExporting);
  const lastResult = useAccountantStore((s) => s.lastExportResult);
  const resetExportState = useAccountantStore((s) => s.resetExportState);

  const [format, setFormat] = useState<"PDF" | "CSV" | "XLSX">("PDF");
  const [period, setPeriod] = useState<string>("Q3 2026");
  const [includeReceipts, setIncludeReceipts] = useState<boolean>(true);

  const formats: Array<{
    id: "PDF" | "CSV" | "XLSX";
    name: string;
    desc: string;
  }> = [
    {
      id: "PDF",
      name: "PDF Statement",
      desc: "Formal formatted document ready for executive review",
    },
    {
      id: "CSV",
      name: "CSV Spreadsheet",
      desc: "Raw transactional data rows for external analysis",
    },
    {
      id: "XLSX",
      name: "Excel Workbook",
      desc: "Multi-tab financial model with embedded formulas",
    },
  ];

  const periods = ["Q3 2026", "Year-to-Date", "Last 6 Months"];

  const handleExport = async () => {
    const config: ReportExportConfig = {
      format,
      period,
      includeReceipts,
    };
    await exportReport(config);
  };

  const handleDismiss = () => {
    resetExportState();
    onClose();
  };

  const handleDownloadReadyFile = () => {
    if (lastResult) {
      Alert.alert(
        "Download Complete",
        `Saved ${lastResult.filename} to device storage.`,
        [{ text: "OK", onPress: handleDismiss }],
      );
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleDismiss}
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
                Export Report
              </Text>
              <Text className="text-xs text-textMuted">
                Figma Frame 41:399 · Financial Report Export
              </Text>
            </View>
          </View>
          <Pressable
            onPress={handleDismiss}
            className="w-9 h-9 rounded-full bg-surface border border-border items-center justify-center min-h-[44px] min-w-[44px]"
            accessibilityRole="button"
            accessibilityLabel="Close export modal"
            collapsable={false}
          >
            <SvgIcon name="x" size={20} color="#6B7280" />
          </Pressable>
        </View>

        <ScrollView
          className="flex-1 px-6 py-4"
          contentContainerStyle={{ paddingBottom: 40 }}
        >
          {lastResult ? (
            /* Figma 84:171: Report Export Ready State */
            <View className="items-center py-6">
              <View className="w-16 h-16 rounded-full bg-emerald-50 items-center justify-center mb-4 border border-emerald-200">
                <SvgIcon name="check-circle" size={36} color="#059669" />
              </View>

              <Text className="text-2xl font-bold text-content-primary text-center">
                Report Ready
              </Text>
              <Text className="text-xs text-emerald-600 font-semibold mt-1">
                Figma Frame 84:171 · Export Completed
              </Text>
              <Text className="text-sm text-content-secondary text-center mt-2 px-4">
                The financial report package has been compiled and is ready for
                download or external transmission.
              </Text>

              {/* Ready File Card */}
              <View className="w-full bg-surface-secondary rounded-2xl p-5 border border-border-subtle mt-6 mb-6">
                <View className="flex-row items-center space-x-3 mb-3">
                  <View className="w-10 h-10 rounded-xl bg-brand-primary/10 items-center justify-center">
                    <SvgIcon name="file-text" size={20} color="#1570EF" />
                  </View>
                  <View className="flex-1">
                    <Text
                      className="text-sm font-bold text-content-primary"
                      numberOfLines={1}
                    >
                      {lastResult.filename}
                    </Text>
                    <Text className="text-xs text-content-secondary mt-0.5">
                      Compiled at {lastResult.timestamp} · 3.4 MB
                    </Text>
                  </View>
                  <Badge variant="success" size="sm" label="Ready" />
                </View>

                <View className="border-t border-border-subtle pt-3 space-y-1">
                  <View className="flex-row justify-between">
                    <Text className="text-xs text-content-secondary">
                      Format
                    </Text>
                    <Text className="text-xs font-semibold text-content-primary">
                      {lastResult.format}
                    </Text>
                  </View>
                  <View className="flex-row justify-between">
                    <Text className="text-xs text-content-secondary">
                      Period
                    </Text>
                    <Text className="text-xs font-semibold text-content-primary">
                      {period}
                    </Text>
                  </View>
                  <View className="flex-row justify-between">
                    <Text className="text-xs text-content-secondary">
                      Attachments
                    </Text>
                    <Text className="text-xs font-semibold text-content-primary">
                      {includeReceipts ? "Included (24 items)" : "Excluded"}
                    </Text>
                  </View>
                </View>
              </View>

              <View className="w-full space-y-3">
                <Button
                  variant="primary"
                  onPress={handleDownloadReadyFile}
                  title="Download Report"
                />
                <Button
                  variant="secondary"
                  onPress={handleDismiss}
                  title="Done"
                />
              </View>
            </View>
          ) : (
            /* Configure Export View Figma 41:399 */
            <View>
              {/* Client Info Banner */}
              <View className="bg-surface-secondary rounded-2xl p-4 border border-border-subtle mb-5 flex-row items-center justify-between">
                <View>
                  <Text className="text-xs font-bold text-content-secondary uppercase tracking-wider">
                    TARGET CLIENT
                  </Text>
                  <Text className="text-base font-bold text-content-primary mt-0.5">
                    Acme Services LLC
                  </Text>
                </View>
                <Badge variant="primary" size="sm" label="Scoped Access" />
              </View>

              {/* Format Selection */}
              <Text className="text-sm font-bold text-content-primary mb-2">
                Export Format
              </Text>
              <View className="space-y-2.5 mb-5">
                {formats.map((fmt) => {
                  const isSelected = format === fmt.id;
                  return (
                    <Pressable
                      key={fmt.id}
                      onPress={() => setFormat(fmt.id)}
                      className={`p-3.5 rounded-xl border flex-row items-center justify-between ${
                        isSelected
                          ? "bg-brand-primary/5 border-brand-primary"
                          : "bg-surface-secondary border-border-subtle"
                      }`}
                      accessibilityLabel={`Select format ${fmt.name}`}
                    >
                      <View className="flex-1 pr-3">
                        <Text
                          className={`text-sm font-bold ${
                            isSelected
                              ? "text-brand-primary"
                              : "text-content-primary"
                          }`}
                        >
                          {fmt.name}
                        </Text>
                        <Text className="text-xs text-content-secondary mt-0.5">
                          {fmt.desc}
                        </Text>
                      </View>
                      <View
                        className={`w-5 h-5 rounded-full border items-center justify-center ${
                          isSelected
                            ? "border-brand-primary bg-brand-primary"
                            : "border-border-subtle bg-surface-primary"
                        }`}
                      >
                        {isSelected && (
                          <View className="w-2 h-2 rounded-full bg-white" />
                        )}
                      </View>
                    </Pressable>
                  );
                })}
              </View>

              {/* Period Selection */}
              <Text className="text-sm font-bold text-content-primary mb-2">
                Reporting Period
              </Text>
              <View className="flex-row space-x-2 mb-5">
                {periods.map((p) => {
                  const isSelected = period === p;
                  return (
                    <Pressable
                      key={p}
                      onPress={() => setPeriod(p)}
                      className={`flex-1 py-2 px-3 rounded-xl border items-center ${
                        isSelected
                          ? "bg-brand-primary border-brand-primary"
                          : "bg-surface-secondary border-border-subtle"
                      }`}
                      accessibilityLabel={`Select period ${p}`}
                    >
                      <Text
                        className={`text-xs font-semibold ${
                          isSelected ? "text-white" : "text-content-secondary"
                        }`}
                      >
                        {p}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              {/* Receipt Attachment Toggle */}
              <Pressable
                onPress={() => setIncludeReceipts(!includeReceipts)}
                className="bg-surface-secondary rounded-2xl p-4 border border-border-subtle flex-row items-center justify-between mb-6"
                accessibilityLabel="Toggle include receipts"
              >
                <View className="flex-1 pr-3">
                  <Text className="text-sm font-bold text-content-primary">
                    Attach source receipts
                  </Text>
                  <Text className="text-xs text-content-secondary mt-0.5">
                    Bundle PDF audit vouchers and OCR slips
                  </Text>
                </View>
                <View
                  className={`w-6 h-6 rounded-md border items-center justify-center ${
                    includeReceipts
                      ? "bg-brand-primary border-brand-primary"
                      : "bg-surface-primary border-border-subtle"
                  }`}
                >
                  {includeReceipts && (
                    <SvgIcon name="check" size={14} color="#FFFFFF" />
                  )}
                </View>
              </Pressable>

              {/* Action Button */}
              <Button
                variant="primary"
                onPress={handleExport}
                loading={isExporting}
                title={
                  isExporting ? "Compiling Report..." : "Generate & Export"
                }
              />
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}
