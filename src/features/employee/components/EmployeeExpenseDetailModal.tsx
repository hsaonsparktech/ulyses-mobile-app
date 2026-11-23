import { useState } from "react";
import { Alert, Modal, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { SvgIcon } from "@/components/ui/SvgIcon";
import { useEmployeeStore } from "../store";
import type { ExpenseDraft } from "../types";

interface EmployeeExpenseDetailModalProps {
  draft: ExpenseDraft | null;
  visible: boolean;
  onClose: () => void;
}

export function EmployeeExpenseDetailModal({
  draft,
  visible,
  onClose,
}: EmployeeExpenseDetailModalProps) {
  const submitDraft = useEmployeeStore((s) => s.submitDraft);
  const deleteDraft = useEmployeeStore((s) => s.deleteDraft);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!draft) return null;

  const handleSubmit = () => {
    setIsSubmitting(true);
    setTimeout(() => {
      submitDraft(draft.id);
      setIsSubmitting(false);
      Alert.alert(
        "Draft Submitted",
        `Expense of $${draft.amount.toFixed(2)} for ${draft.vendor} has been submitted to your business owner for approval.`,
        [{ text: "OK", onPress: onClose }],
      );
    }, 400);
  };

  const handleDelete = () => {
    Alert.alert(
      "Delete Draft",
      `Are you sure you want to delete this ${draft.vendor} draft?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            deleteDraft(draft.id);
            onClose();
          },
        },
      ],
    );
  };

  const getStatusBadge = (status: ExpenseDraft["status"]) => {
    switch (status) {
      case "approved":
        return <Badge variant="success" size="sm" label="Approved" />;
      case "submitted":
        return <Badge variant="warning" size="sm" label="Pending Review" />;
      case "rejected":
        return <Badge variant="danger" size="sm" label="Rejected" />;
      default:
        return <Badge variant="default" size="sm" label="Saved Draft" />;
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
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
                Expense Details
              </Text>
              <Text className="text-xs text-textMuted">
                Figma Frame 41:61 · Employee Review
              </Text>
            </View>
          </View>
          <Pressable
            onPress={onClose}
            className="w-9 h-9 rounded-full bg-surface border border-border items-center justify-center min-h-[44px] min-w-[44px]"
            accessibilityRole="button"
            accessibilityLabel="Close"
            collapsable={false}
          >
            <SvgIcon name="x" size={20} color="#6B7280" />
          </Pressable>
        </View>

        <ScrollView
          className="flex-1 px-6 py-4"
          contentContainerStyle={{ paddingBottom: 40 }}
        >
          {/* Status banner */}
          <View className="flex-row items-center justify-between bg-surface-secondary p-4 rounded-2xl border border-border-subtle mb-5">
            <View>
              <Text className="text-xs font-semibold text-content-secondary uppercase">
                Claim Status
              </Text>
              <Text className="text-sm font-bold text-content-primary mt-0.5">
                {draft.status === "draft"
                  ? "Saved locally on device"
                  : draft.status === "submitted"
                    ? "Pending owner sign-off"
                    : "Reimbursement approved"}
              </Text>
            </View>
            {getStatusBadge(draft.status)}
          </View>

          {/* Amount Hero */}
          <View className="bg-surface-secondary rounded-2xl p-5 border border-border-subtle mb-5 items-center">
            <Text className="text-xs font-semibold text-content-secondary uppercase mb-1">
              Total Claimed Amount
            </Text>
            <Text className="text-3xl font-extrabold text-content-primary">
              ${draft.amount.toFixed(2)}
            </Text>
            <Text className="text-xs text-content-secondary mt-1">
              USD · Charged to Acme Services LLC
            </Text>
          </View>

          {/* Details list */}
          <View className="bg-surface-secondary rounded-2xl p-4 border border-border-subtle mb-5 space-y-3">
            <View className="flex-row justify-between py-1.5 border-b border-border-subtle/50">
              <Text className="text-sm text-content-secondary">Vendor</Text>
              <Text className="text-sm font-bold text-content-primary">
                {draft.vendor}
              </Text>
            </View>

            <View className="flex-row justify-between py-1.5 border-b border-border-subtle/50">
              <Text className="text-sm text-content-secondary">
                Transaction Date
              </Text>
              <Text className="text-sm font-semibold text-content-primary">
                {draft.date}
              </Text>
            </View>

            <View className="flex-row justify-between py-1.5 border-b border-border-subtle/50">
              <Text className="text-sm text-content-secondary">Category</Text>
              <Text className="text-sm font-semibold text-content-primary">
                {draft.category}
              </Text>
            </View>

            {draft.receiptFileName && (
              <View className="flex-row justify-between py-1.5 items-center">
                <Text className="text-sm text-content-secondary">
                  Receipt Document
                </Text>
                <View className="flex-row items-center space-x-1.5 bg-brand-primary/10 px-2.5 py-1 rounded-lg">
                  <SvgIcon name="file-text" size={14} color="#1570EF" />
                  <Text className="text-xs font-semibold text-brand-primary">
                    {draft.receiptFileName}
                  </Text>
                </View>
              </View>
            )}
          </View>

          {/* Notes */}
          {draft.notes && (
            <View className="bg-surface-secondary rounded-2xl p-4 border border-border-subtle mb-6">
              <Text className="text-xs font-semibold text-content-secondary uppercase mb-1">
                Business Justification
              </Text>
              <Text className="text-sm text-content-primary leading-5">
                {draft.notes}
              </Text>
            </View>
          )}

          {/* Actions */}
          <View className="space-y-3">
            {draft.status === "draft" && (
              <Button
                variant="primary"
                title={
                  isSubmitting ? "Submitting Claim..." : "Submit for Approval"
                }
                onPress={handleSubmit}
                disabled={isSubmitting}
                accessibilityLabel="Submit expense claim for approval"
              />
            )}

            {draft.status === "draft" && (
              <Button
                variant="destructive"
                title="Delete Draft"
                onPress={handleDelete}
                accessibilityLabel="Delete this expense draft"
              />
            )}

            <Button
              variant="secondary"
              title="Close"
              onPress={onClose}
              accessibilityLabel="Close modal"
            />
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}
