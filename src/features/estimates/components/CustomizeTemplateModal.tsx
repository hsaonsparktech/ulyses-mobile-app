import { useState } from "react";
import { Alert, Modal, Pressable, ScrollView, View } from "react-native";
import { Button } from "@/components/ui/Button";
import { Text } from "@/components/ui/Text";

export type TemplateStyle = "clean" | "modern" | "classic";

export interface CustomizeTemplateModalProps {
  visible: boolean;
  businessName: string;
  onClose: () => void;
  onSave?: (settings: {
    template: TemplateStyle;
    accentColor: string;
    showTax: boolean;
  }) => void;
}

export function CustomizeTemplateModal({
  visible,
  businessName,
  onClose,
  onSave,
}: CustomizeTemplateModalProps) {
  const [selectedTemplate, setSelectedTemplate] =
    useState<TemplateStyle>("clean");
  const [accentColor, _setAccentColor] = useState("Libros blue");
  const [showTax, setShowTax] = useState(true);
  const [showAiModal, setShowAiModal] = useState(false);

  const handleSave = () => {
    if (onSave) {
      onSave({
        template: selectedTemplate,
        accentColor,
        showTax,
      });
    }
    Alert.alert("Success", "Template preferences updated.");
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
          contentContainerStyle={{ paddingBottom: 40 }}
        >
          {/* Header Figma 81:768 */}
          <View className="mb-6">
            <Text variant="Title" className="font-semibold text-text">
              Customize invoice
            </Text>
            <Text variant="Caption" tone="muted" className="mt-1">
              Branding and template preferences
            </Text>
          </View>

          {/* Template choices Figma 223:942 */}
          <View className="mb-5">
            <Text variant="Label" className="mb-2">
              Template
            </Text>
            <View className="flex-row gap-2.5">
              {(
                [
                  { id: "clean", name: "Clean" },
                  { id: "modern", name: "Modern" },
                  { id: "classic", name: "Classic" },
                ] as const
              ).map((t) => (
                <Pressable
                  key={t.id}
                  accessibilityRole="button"
                  accessibilityLabel={`Select ${t.name} template`}
                  onPress={() => setSelectedTemplate(t.id)}
                  className={`flex-1 p-3.5 rounded-[12px] border items-center ${
                    selectedTemplate === t.id
                      ? "border-primary bg-primarySoft"
                      : "border-border bg-surface"
                  }`}
                >
                  <View className="w-6 h-8 bg-surfaceAlt border border-border rounded-xs mb-2" />
                  <Text
                    variant="Caption"
                    tone={selectedTemplate === t.id ? "primary" : "text"}
                    className="font-medium"
                  >
                    {t.name}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Business Logo Field Figma 81:792 */}
          <View className="mb-4">
            <Text variant="Label" className="mb-2">
              Business logo
            </Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Upload custom business logo"
              onPress={() =>
                Alert.alert(
                  "Business Logo",
                  "Preserves customer business initials or uploaded image. Libros branding is not used for customer invoices.",
                )
              }
              className="bg-surface border border-border rounded-md p-3.5"
            >
              <Text variant="Body" tone="muted">
                Choose or upload logo
              </Text>
            </Pressable>
          </View>

          {/* Accent Color Field Figma 81:794 */}
          <View className="mb-4">
            <Text variant="Label" className="mb-2">
              Accent color
            </Text>
            <View className="bg-surface border border-border rounded-md p-3.5 flex-row justify-between items-center">
              <Text variant="Body" className="text-text">
                {accentColor}
              </Text>
              <View className="w-5 h-5 rounded-full bg-primary" />
            </View>
          </View>

          {/* Tax and Line items Field Figma 81:797 */}
          <View className="mb-5">
            <Text variant="Label" className="mb-2">
              Tax and line items
            </Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Toggle show tax on invoice"
              onPress={() => setShowTax((v) => !v)}
              className="bg-surface border border-border rounded-md p-3.5 flex-row justify-between items-center"
            >
              <Text variant="Body" className="text-text">
                Show on invoice
              </Text>
              <Text
                variant="Caption"
                tone={showTax ? "positive" : "muted"}
                className="font-semibold"
              >
                {showTax ? "Enabled" : "Hidden"}
              </Text>
            </Pressable>
          </View>

          {/* Generate with AI button Figma 95:538 */}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Generate template with AI"
            onPress={() => setShowAiModal(true)}
            className="bg-warningSoft border border-warning/30 rounded-md p-3.5 items-center mb-6"
          >
            <Text variant="Body" tone="warning" className="font-medium">
              Generate with AI
            </Text>
          </Pressable>

          {/* Note card Figma 81:800 */}
          <View className="bg-surface border border-border rounded-md p-3.5 mb-6">
            <Text variant="Caption" tone="muted">
              Templates may use stored business data and apply to both invoices
              and estimates.
            </Text>
          </View>

          {/* Actions Figma 201:944 */}
          <View className="flex-row gap-3">
            <View className="flex-1">
              <Button title="Cancel" variant="secondary" onPress={onClose} />
            </View>
            <View className="flex-1">
              <Button
                title="Save template"
                variant="primary"
                onPress={handleSave}
              />
            </View>
          </View>
        </ScrollView>
      </View>

      {/* AI Template Generation Preview Modal Figma 94:627 */}
      <Modal
        visible={showAiModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowAiModal(false)}
      >
        <View className="flex-1 bg-canvas">
          <ScrollView
            className="flex-1 px-4 pt-6"
            contentContainerStyle={{ paddingBottom: 40 }}
          >
            <View className="mb-6">
              <Text variant="Title" className="font-semibold text-text">
                AI invoice template
              </Text>
              <Text variant="Caption" tone="muted" className="mt-1">
                Generate a draft from your business data
              </Text>
            </View>

            <View className="gap-3.5 mb-6">
              <View className="bg-surface border border-border rounded-[14px] p-4">
                <Text variant="Caption" tone="muted" className="mb-1">
                  Document
                </Text>
                <Text variant="Body" className="font-medium text-text">
                  Estimate or invoice
                </Text>
              </View>

              <View className="bg-surface border border-border rounded-[14px] p-4">
                <Text variant="Caption" tone="muted" className="mb-1">
                  Business
                </Text>
                <Text variant="Body" className="font-medium text-text">
                  {businessName}
                </Text>
              </View>

              <View className="bg-surface border border-border rounded-[14px] p-4">
                <Text variant="Caption" tone="muted" className="mb-1">
                  Suggested style
                </Text>
                <Text variant="Body" tone="primary" className="font-semibold">
                  Clean Standard
                </Text>
              </View>

              <View className="bg-surface border border-border rounded-md p-3.5">
                <Text variant="Caption" tone="muted">
                  AI suggestions are drafts and require confirmation before
                  applying to customer documents.
                </Text>
              </View>
            </View>

            <View className="flex-row gap-3">
              <View className="flex-1">
                <Button
                  title="Back"
                  variant="secondary"
                  onPress={() => setShowAiModal(false)}
                />
              </View>
              <View className="flex-1">
                <Button
                  title="Apply template"
                  variant="primary"
                  onPress={() => {
                    setSelectedTemplate("clean");
                    setShowAiModal(false);
                    Alert.alert(
                      "Template Applied",
                      "Clean Standard layout selected.",
                    );
                  }}
                />
              </View>
            </View>
          </ScrollView>
        </View>
      </Modal>
    </Modal>
  );
}
