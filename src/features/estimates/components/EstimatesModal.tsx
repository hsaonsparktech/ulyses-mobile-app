import { useMemo, useState } from "react";
import { Modal, Pressable, ScrollView, View } from "react-native";
import { Button } from "@/components/ui/Button";
import { Text } from "@/components/ui/Text";
import { useEstimateStore } from "../store";
import type { Estimate } from "../types";
import { CustomizeTemplateModal } from "./CustomizeTemplateModal";
import { EstimateBuilderModal } from "./EstimateBuilderModal";
import { EstimateCard } from "./EstimateCard";
import { EstimatePreviewModal } from "./EstimatePreviewModal";
import { SendEstimateModal } from "./SendEstimateModal";

export interface EstimatesModalProps {
  visible: boolean;
  businessId: string;
  businessName: string;
  onClose: () => void;
  onConvertedToInvoice?: (invoiceId: string) => void;
}

type FilterStatus = "All" | "Draft" | "Sent" | "Accepted";

export function EstimatesModal({
  visible,
  businessId,
  businessName,
  onClose,
  onConvertedToInvoice,
}: EstimatesModalProps) {
  const [activeFilter, setActiveFilter] = useState<FilterStatus>("All");
  const [selectedEstimate, setSelectedEstimate] = useState<Estimate | null>(
    null,
  );
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showTemplateModal, setShowTemplateModal] = useState(false);

  const allEstimates = useEstimateStore((s) => s.estimates);
  const estimates = useMemo(
    () => allEstimates.filter((e) => e.businessId === businessId),
    [allEstimates, businessId],
  );

  const filteredEstimates = useMemo(() => {
    if (activeFilter === "All") return estimates;
    return estimates.filter((e) => e.status === activeFilter);
  }, [estimates, activeFilter]);

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
          {/* Header Figma 94:522 */}
          <View className="flex-row justify-between items-start mb-4">
            <View>
              <Text variant="Title" className="font-semibold text-text">
                Estimates
              </Text>
              <Text variant="Caption" tone="muted" className="mt-1">
                Drafts and customer quotations
              </Text>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Customize invoice and estimate template"
              onPress={() => setShowTemplateModal(true)}
              className="py-1 px-3 bg-surface border border-border rounded-md"
            >
              <Text variant="Caption" tone="primary" className="font-medium">
                Template
              </Text>
            </Pressable>
          </View>

          {/* List Filters Card Figma 94:548 */}
          <View className="bg-surface border border-border rounded-[14px] p-4 mb-4">
            <Text variant="Caption" tone="muted">
              SEARCH / STATUS
            </Text>
            <Text variant="Body" className="font-medium text-text mt-1 mb-3">
              {businessName} · {filteredEstimates.length} records
            </Text>

            {/* Filter pills */}
            <View className="flex-row gap-2">
              {(["All", "Draft", "Sent", "Accepted"] as const).map((filter) => (
                <Pressable
                  key={filter}
                  accessibilityRole="button"
                  accessibilityLabel={`Filter by ${filter}`}
                  onPress={() => setActiveFilter(filter)}
                  className={`px-3 py-1.5 rounded-pill border ${
                    activeFilter === filter
                      ? "bg-primarySoft border-primary"
                      : "bg-surface border-border"
                  }`}
                >
                  <Text
                    variant="Caption"
                    tone={activeFilter === filter ? "primary" : "muted"}
                  >
                    {filter}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Estimates List */}
          <View className="gap-2.5 mb-6">
            {filteredEstimates.map((est) => (
              <EstimateCard
                key={est.id}
                estimate={est}
                onPress={() => setSelectedEstimate(est)}
              />
            ))}
            {filteredEstimates.length === 0 && (
              <View className="bg-surface border border-border rounded-[14px] p-6 items-center">
                <Text variant="Body" tone="muted" className="text-center">
                  No {activeFilter === "All" ? "" : activeFilter.toLowerCase()}{" "}
                  estimates found.
                </Text>
              </View>
            )}
          </View>

          {/* Context Note Figma 94:567 */}
          <View className="bg-surface border border-border rounded-md p-3.5 mb-6">
            <Text variant="Caption" tone="muted">
              Track and share estimates without payment collection. You can
              convert to an invoice upon acceptance.
            </Text>
          </View>

          {/* Actions Figma 201:946 */}
          <View className="flex-row gap-3">
            <View className="flex-1">
              <Button
                title="Back to invoices"
                variant="secondary"
                onPress={onClose}
              />
            </View>
            <View className="flex-1">
              <Button
                title="Create estimate"
                variant="primary"
                onPress={() => setShowCreateModal(true)}
              />
            </View>
          </View>
        </ScrollView>
      </View>

      {/* Sub Modals */}
      <EstimatePreviewModal
        estimate={selectedEstimate}
        businessName={businessName}
        visible={selectedEstimate !== null}
        onClose={() => setSelectedEstimate(null)}
        onOpenShare={(_est) => {
          setSelectedEstimate(null);
          setShowShareModal(true);
        }}
        onConvertedToInvoice={(invoiceId) => {
          setSelectedEstimate(null);
          onClose();
          if (onConvertedToInvoice) {
            onConvertedToInvoice(invoiceId);
          }
        }}
      />

      <SendEstimateModal
        estimate={selectedEstimate}
        businessName={businessName}
        visible={showShareModal}
        onClose={() => setShowShareModal(false)}
      />

      <EstimateBuilderModal
        visible={showCreateModal}
        businessId={businessId}
        onClose={() => setShowCreateModal(false)}
        onEstimateCreated={(newEst) => {
          setSelectedEstimate(newEst);
        }}
      />

      <CustomizeTemplateModal
        visible={showTemplateModal}
        businessName={businessName}
        onClose={() => setShowTemplateModal(false)}
      />
    </Modal>
  );
}
