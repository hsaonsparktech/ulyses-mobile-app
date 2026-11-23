import { useState } from "react";
import { Modal, Pressable, View } from "react-native";
import { Button } from "@/components/ui/Button";
import { FeedbackIcon, UtilityIcon } from "@/components/ui/Icon";
import { Text } from "@/components/ui/Text";

export interface ReportExportModalProps {
  visible: boolean;
  onClose: () => void;
  businessName?: string;
}

export function ReportExportModal({
  visible,
  onClose,
  businessName = "Acme Services LLC",
}: ReportExportModalProps) {
  const [format, setFormat] = useState<"PDF" | "CSV">("PDF");
  const [exportReady, setExportReady] = useState(false);
  const [generating, setGenerating] = useState(false);

  const handleGenerate = () => {
    setGenerating(true);
    setTimeout(() => {
      setGenerating(false);
      setExportReady(true);
    }, 600);
  };

  const handleReset = () => {
    setExportReady(false);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleReset}
    >
      <Pressable
        className="flex-1 justify-center bg-black/50 p-4"
        onPress={handleReset}
      >
        <Pressable
          className="rounded-[20px] border border-border bg-surface p-6 shadow-xl"
          onPress={(e) => e.stopPropagation()}
        >
          {exportReady ? (
            /* Export Ready state (Figma 86:643) */
            <View className="items-center gap-4 py-3">
              <View className="size-16 items-center justify-center rounded-full bg-primarySoft">
                <FeedbackIcon variant="success" size={32} />
              </View>

              <View className="items-center gap-1">
                <Text variant="Heading" className="text-center">
                  Report export ready
                </Text>
                <Text variant="BodySmall" tone="muted" className="text-center">
                  November 2026 statement for {businessName} has been compiled
                  as {format}.
                </Text>
              </View>

              <View className="w-full gap-2 pt-3">
                <Button
                  title={`Download ${format}`}
                  variant="primary"
                  onPress={handleReset}
                />
                <Button
                  title="Done"
                  variant="secondary"
                  onPress={handleReset}
                />
              </View>
            </View>
          ) : (
            /* Export Options state (Figma 81:1262) */
            <View className="gap-4">
              <View className="flex-row items-center justify-between">
                <View>
                  <Text variant="Heading">Export report</Text>
                  <Text variant="BodySmall" tone="muted">
                    November 2026 financial summary
                  </Text>
                </View>

                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Close"
                  hitSlop={8}
                  onPress={handleReset}
                  className="rounded-full bg-surfaceAlt p-2"
                >
                  <UtilityIcon name="chevron-down" size={16} />
                </Pressable>
              </View>

              {/* Format selection */}
              <View className="gap-2">
                <Text variant="Label">Select export format</Text>
                <View className="flex-row gap-2">
                  {(["PDF", "CSV"] as const).map((fmt) => (
                    <View key={fmt} className="flex-1">
                      <Button
                        title={
                          fmt === "PDF" ? "PDF Document" : "CSV Spreadsheet"
                        }
                        variant={format === fmt ? "primary" : "secondary"}
                        onPress={() => setFormat(fmt)}
                      />
                    </View>
                  ))}
                </View>
              </View>

              <View className="rounded-md border border-border bg-surfaceAlt p-3">
                <Text variant="Caption" tone="muted">
                  Includes income, expenses, profit and loss overview, and top
                  vendor breakdowns for {businessName}.
                </Text>
              </View>

              <View className="gap-2 pt-2">
                <Button
                  title="Generate export"
                  variant="primary"
                  loading={generating}
                  onPress={handleGenerate}
                />
                <Button
                  title="Cancel"
                  variant="secondary"
                  onPress={handleReset}
                />
              </View>
            </View>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}
