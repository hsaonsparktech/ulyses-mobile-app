import { useState } from "react";
import { Alert, Modal, Pressable, ScrollView, Text, View } from "react-native";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { SvgIcon } from "@/components/ui/SvgIcon";
import { useScanStore } from "../store";
import type { StatementLine } from "../types";

export function StatementReviewModal() {
  const isOpen = useScanStore((s) => s.statementModalOpen);
  const currentScan = useScanStore((s) => s.currentScan);
  const setStatementModalOpen = useScanStore((s) => s.setStatementModalOpen);
  const [selectedLine, setSelectedLine] = useState<StatementLine | null>(null);

  if (!isOpen || !currentScan) return null;

  const lines = currentScan.lines || [];

  const handleImportAll = () => {
    setStatementModalOpen(false);
    Alert.alert(
      "Statement Imported",
      `Imported ${lines.length} statement lines into your ledger.`,
      [{ text: "OK" }],
    );
  };

  return (
    <Modal
      visible={isOpen}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={() => setStatementModalOpen(false)}
    >
      <View className="flex-1 bg-surface-primary">
        {/* Header */}
        <View className="flex-row items-center justify-between px-6 pt-6 pb-4 border-b border-border-subtle bg-surface-primary">
          <View className="flex-row items-center space-x-3">
            <View className="w-10 h-10 rounded-full bg-accent-purple/10 items-center justify-center">
              <SvgIcon name="file-text" size={20} color="#7C3AED" />
            </View>
            <View>
              <Text className="text-xl font-bold text-content-primary">
                Statement Review
              </Text>
              <Text className="text-xs text-content-secondary">
                Figma Frame 81:857 & 94:573 · {lines.length} Lines Parsed
              </Text>
            </View>
          </View>
          <Pressable
            onPress={() => setStatementModalOpen(false)}
            className="w-9 h-9 rounded-full bg-surface-secondary items-center justify-center"
            accessibilityLabel="Close statement review"
          >
            <SvgIcon name="x" size={20} color="#374151" />
          </Pressable>
        </View>

        <ScrollView
          className="flex-1 px-6 py-4"
          contentContainerStyle={{ paddingBottom: 40 }}
        >
          {/* Statement metadata */}
          <View className="bg-surface-secondary rounded-2xl p-4 border border-border-subtle mb-5">
            <Text className="text-xs font-semibold text-content-secondary uppercase tracking-wider mb-2">
              Source Statement
            </Text>
            <Text className="text-base font-bold text-content-primary">
              {currentScan.vendor}
            </Text>
            <Text className="text-xs text-content-secondary mt-0.5">
              Period: {currentScan.date} · {currentScan.fileName}
            </Text>
          </View>

          <Text className="text-sm font-bold text-content-primary mb-3">
            Parsed Statement Lines ({lines.length})
          </Text>

          {/* Line list */}
          <View className="space-y-3 mb-6">
            {lines.map((line) => {
              const isSelected = selectedLine?.id === line.id;
              return (
                <Pressable
                  key={line.id}
                  onPress={() => setSelectedLine(isSelected ? null : line)}
                  className={`p-4 rounded-xl border ${
                    isSelected
                      ? "border-brand-primary bg-brand-primary/5"
                      : "border-border-subtle bg-surface-secondary"
                  }`}
                  accessibilityLabel={`Statement line ${line.description}`}
                >
                  <View className="flex-row items-center justify-between mb-1.5">
                    <Text className="text-xs font-medium text-content-secondary">
                      {line.date}
                    </Text>
                    <Badge
                      variant={
                        line.status === "matched" ? "success" : "warning"
                      }
                      size="sm"
                      label={
                        line.status === "matched" ? "Matched" : "Needs Review"
                      }
                    />
                  </View>

                  <View className="flex-row items-center justify-between">
                    <Text
                      className="text-sm font-semibold text-content-primary flex-1 mr-2"
                      numberOfLines={1}
                    >
                      {line.description}
                    </Text>
                    <Text
                      className={`text-sm font-bold ${
                        line.type === "credit"
                          ? "text-feedback-success"
                          : "text-content-primary"
                      }`}
                    >
                      {line.type === "credit" ? "+" : "-"}$
                      {line.amount.toFixed(2)}
                    </Text>
                  </View>

                  <View className="flex-row items-center justify-between mt-2 pt-2 border-t border-border-subtle">
                    <Text className="text-xs text-content-secondary">
                      Category: {line.category}
                    </Text>
                    <SvgIcon
                      name={isSelected ? "chevron-up" : "chevron-down"}
                      size={14}
                      color="#9CA3AF"
                    />
                  </View>

                  {/* Expanded line detail */}
                  {isSelected && (
                    <View className="mt-3 pt-3 border-t border-border-subtle bg-surface-primary p-3 rounded-lg">
                      <Text className="text-xs font-bold text-content-primary mb-1">
                        Figma 94:573 · Line Details
                      </Text>
                      <Text className="text-xs text-content-secondary mb-2">
                        Matched to ledger chart of accounts automatically.
                      </Text>
                      <View className="flex-row space-x-2">
                        <Pressable
                          onPress={() => {
                            Alert.alert(
                              "Re-categorized",
                              "Updated transaction category.",
                            );
                          }}
                          className="px-3 py-1.5 rounded-lg bg-surface-secondary border border-border-subtle"
                        >
                          <Text className="text-xs font-medium text-content-primary">
                            Change Category
                          </Text>
                        </Pressable>
                        <Pressable
                          onPress={() => {
                            Alert.alert(
                              "Rule Created",
                              "Created rule for future matches.",
                            );
                          }}
                          className="px-3 py-1.5 rounded-lg bg-surface-secondary border border-border-subtle"
                        >
                          <Text className="text-xs font-medium text-content-primary">
                            Create Auto-rule
                          </Text>
                        </Pressable>
                      </View>
                    </View>
                  )}
                </Pressable>
              );
            })}
          </View>

          <Button
            variant="primary"
            title="Import All Verified Lines"
            onPress={handleImportAll}
            accessibilityLabel="Confirm and import all statement lines"
          />
        </ScrollView>
      </View>
    </Modal>
  );
}
