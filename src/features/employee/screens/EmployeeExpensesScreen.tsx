import { useEffect, useRef, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { FeedbackIcon } from "@/components/ui/Icon";
import { LibrosLogo } from "@/components/ui/LibrosLogo";
import { SvgIcon } from "@/components/ui/SvgIcon";
import { EmployeeExpenseDetailModal } from "../components/EmployeeExpenseDetailModal";
import { useEmployeeStore } from "../store";
import type { ExpenseDraft } from "../types";

export function EmployeeExpensesScreen() {
  const drafts = useEmployeeStore((s) => s.drafts);
  const addDraft = useEmployeeStore((s) => s.addDraft);
  const [activeTab, setActiveTab] = useState<"new" | "history" | "saved">(
    "new",
  );
  const [selectedDraft, setSelectedDraft] = useState<ExpenseDraft | null>(null);
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    if (activeTab) {
      scrollViewRef.current?.scrollTo({ y: 0, animated: false });
    }
  }, [activeTab]);

  // Form State
  const [vendor, setVendor] = useState("Oak Street Supply");
  const [amount, setAmount] = useState("128.40");
  const [date, setDate] = useState("Nov 06, 2026");
  const [category, setCategory] = useState("Office supplies");
  const [receiptAttached, setReceiptAttached] = useState<boolean>(true);
  const [receiptFileName, setReceiptFileName] = useState("OakStreet-Nov06.pdf");
  const [notes, _setNotes] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!vendor.trim()) errs.vendor = "Vendor name is required.";
    const parsedAmount = parseFloat(amount);
    if (Number.isNaN(parsedAmount) || parsedAmount <= 0)
      errs.amount = "Enter a valid positive expense amount.";
    if (!category.trim()) errs.category = "Category is required.";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSaveDraft = () => {
    if (!validate()) return;

    addDraft({
      vendor: vendor.trim(),
      amount: parseFloat(amount) || 0,
      date,
      category,
      receiptFileName: receiptAttached ? receiptFileName : undefined,
      notes: notes.trim(),
    });

    setActiveTab("saved");
  };

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-surface-primary"
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      {/* Header Bar */}
      <View className="px-6 pt-12 pb-4 bg-surface-primary border-b border-border-subtle">
        <View className="flex-row items-center justify-between mb-3">
          <View className="flex-row items-center space-x-2.5">
            <LibrosLogo variant="compact" width={22} height={15.98} />
            <Text className="text-xl font-bold text-content-primary">
              Libros
            </Text>
          </View>

          {/* Role Badge Figma 165:83 */}
          <View className="flex-row items-center bg-brand-primary/10 px-3 py-1.5 rounded-full space-x-1.5 border border-brand-primary/20">
            <SvgIcon name="user" size={14} color="#1570EF" />
            <Text className="text-xs font-bold text-brand-primary tracking-wider">
              EMPLOYEE
            </Text>
          </View>
        </View>

        {/* Tab switch */}
        <View className="flex-row bg-surface-secondary p-1 rounded-xl border border-border-subtle">
          <Pressable
            onPress={() => setActiveTab("new")}
            className="flex-1 py-2 rounded-lg items-center"
            style={
              activeTab === "new"
                ? {
                    backgroundColor: "#FFFFFF",
                    elevation: 1,
                    shadowColor: "#000000",
                    shadowOffset: { width: 0, height: 1 },
                    shadowOpacity: 0.05,
                    shadowRadius: 2,
                  }
                : undefined
            }
          >
            <Text
              className={`text-xs font-bold ${
                activeTab === "new"
                  ? "text-brand-primary"
                  : "text-content-secondary"
              }`}
            >
              + New Expense Draft
            </Text>
          </Pressable>

          <Pressable
            onPress={() => setActiveTab("history")}
            className="flex-1 py-2 rounded-lg items-center"
            style={
              activeTab === "history" || activeTab === "saved"
                ? {
                    backgroundColor: "#FFFFFF",
                    elevation: 1,
                    shadowColor: "#000000",
                    shadowOffset: { width: 0, height: 1 },
                    shadowOpacity: 0.05,
                    shadowRadius: 2,
                  }
                : undefined
            }
          >
            <Text
              className={`text-xs font-bold ${
                activeTab === "history" || activeTab === "saved"
                  ? "text-brand-primary"
                  : "text-content-secondary"
              }`}
            >
              Expense History ({drafts.length})
            </Text>
          </Pressable>
        </View>
      </View>

      <ScrollView
        ref={scrollViewRef}
        className="flex-1 px-6 py-5"
        contentContainerStyle={{ paddingBottom: 60 }}
      >
        {activeTab === "saved" ? (
          /* Figma 84:72: Draft Saved State */
          <View className="items-center py-6">
            <View className="mb-6 w-[100px] h-[100px] rounded-full bg-feedback-success/10 items-center justify-center border border-feedback-success/20">
              <FeedbackIcon variant="success" size={44} />
            </View>

            <Text className="text-2xl font-bold text-content-primary text-center mb-1">
              Draft submitted
            </Text>
            <Text className="text-sm text-content-secondary text-center mb-6">
              Your expense draft is saved
            </Text>

            {/* Card / State summary */}
            <View className="w-full bg-surface-secondary rounded-2xl p-5 border border-border-subtle mb-4">
              <Text className="text-base font-bold text-content-primary mb-1">
                Expense draft saved
              </Text>
              <Text className="text-sm text-content-secondary leading-5">
                An authorized user may review it for approval and ledger
                reconciliation.
              </Text>
            </View>

            {/* Card / Access note */}
            <View className="w-full bg-surface-secondary rounded-xl p-3.5 border border-border-subtle mb-8">
              <Text className="text-xs text-content-secondary">
                No financial data was finalized automatically.
              </Text>
            </View>

            {/* Actions */}
            <View className="w-full space-y-3">
              <Button
                variant="primary"
                title="View my activity"
                onPress={() => setActiveTab("history")}
                accessibilityLabel="View my activity"
              />
              <Button
                variant="secondary"
                title="Add another draft"
                onPress={() => {
                  setVendor("");
                  setAmount("");
                  setActiveTab("new");
                }}
                accessibilityLabel="Add another draft"
              />
            </View>
          </View>
        ) : activeTab === "new" ? (
          /* Form Figma 41:61 */
          <View>
            <View className="mb-5">
              <Text className="text-2xl font-bold text-content-primary">
                Expense draft
              </Text>
              <Text className="text-xs text-content-secondary mt-1">
                Acme Services · Review details before saving
              </Text>
            </View>

            {/* Vendor Input */}
            <View className="mb-4">
              <Text className="text-sm font-semibold text-content-primary mb-1.5">
                Vendor
              </Text>
              <TextInput
                className={`bg-surface-secondary px-4 py-3.5 rounded-xl border text-sm text-content-primary ${
                  errors.vendor
                    ? "border-feedback-danger"
                    : "border-border-subtle"
                }`}
                placeholder="Enter merchant or vendor name"
                placeholderTextColor="#9CA3AF"
                value={vendor}
                onChangeText={(t) => {
                  setVendor(t);
                  if (errors.vendor) setErrors({ ...errors, vendor: "" });
                }}
              />
              {errors.vendor && (
                <Text className="text-xs text-feedback-danger mt-1">
                  {errors.vendor}
                </Text>
              )}
            </View>

            {/* Amount Input */}
            <View className="mb-4">
              <Text className="text-sm font-semibold text-content-primary mb-1.5">
                Amount (USD)
              </Text>
              <TextInput
                className={`bg-surface-secondary px-4 py-3.5 rounded-xl border text-sm text-content-primary ${
                  errors.amount
                    ? "border-feedback-danger"
                    : "border-border-subtle"
                }`}
                placeholder="0.00"
                placeholderTextColor="#9CA3AF"
                keyboardType="decimal-pad"
                value={amount}
                onChangeText={(t) => {
                  setAmount(t);
                  if (errors.amount) setErrors({ ...errors, amount: "" });
                }}
              />
              {errors.amount && (
                <Text className="text-xs text-feedback-danger mt-1">
                  {errors.amount}
                </Text>
              )}
            </View>

            {/* Date Input */}
            <View className="mb-4">
              <Text className="text-sm font-semibold text-content-primary mb-1.5">
                Date
              </Text>
              <TextInput
                className="bg-surface-secondary px-4 py-3.5 rounded-xl border border-border-subtle text-sm text-content-primary"
                placeholder="Nov 06, 2026"
                placeholderTextColor="#9CA3AF"
                value={date}
                onChangeText={setDate}
              />
            </View>

            {/* Category Input */}
            <View className="mb-5">
              <Text className="text-sm font-semibold text-content-primary mb-1.5">
                Category
              </Text>
              <TextInput
                className={`bg-surface-secondary px-4 py-3.5 rounded-xl border text-sm text-content-primary ${
                  errors.category
                    ? "border-feedback-danger"
                    : "border-border-subtle"
                }`}
                placeholder="e.g. Office supplies, Travel, Meals"
                placeholderTextColor="#9CA3AF"
                value={category}
                onChangeText={(t) => {
                  setCategory(t);
                  if (errors.category) setErrors({ ...errors, category: "" });
                }}
              />
              {errors.category && (
                <Text className="text-xs text-feedback-danger mt-1">
                  {errors.category}
                </Text>
              )}
            </View>

            {/* Receipt Attachment Card Figma 41:79 */}
            <View className="bg-surface-secondary rounded-2xl p-4 border border-border-subtle mb-6 flex-row items-center justify-between">
              <View className="flex-1 mr-3">
                <Text className="text-sm font-bold text-content-primary">
                  {receiptAttached ? "Receipt attached" : "No receipt attached"}
                </Text>
                <Text className="text-xs text-content-secondary mt-0.5">
                  {receiptAttached
                    ? receiptFileName
                    : "Attach receipt image or PDF file"}
                </Text>
              </View>

              <Pressable
                onPress={() => {
                  if (receiptAttached) {
                    setReceiptAttached(false);
                  } else {
                    setReceiptAttached(true);
                    setReceiptFileName("Receipt_Upload.pdf");
                  }
                }}
                className="w-10 h-10 rounded-xl bg-brand-primary/10 items-center justify-center active:bg-brand-primary/20"
                accessibilityLabel="Toggle receipt attachment"
              >
                <SvgIcon
                  name={receiptAttached ? "check-circle" : "file-text"}
                  size={20}
                  color="#1570EF"
                />
              </Pressable>
            </View>

            {/* Save CTA */}
            <Button
              variant="primary"
              title="Save expense draft"
              onPress={handleSaveDraft}
              accessibilityLabel="Save expense draft"
            />
          </View>
        ) : (
          /* History / Activity Figma 41:120 */
          <View>
            <View className="mb-4">
              <Text className="text-2xl font-bold text-content-primary">
                My Expenses
              </Text>
              <Text className="text-xs text-content-secondary mt-1">
                All submitted and saved reimbursement claims
              </Text>
            </View>

            <View className="space-y-3">
              {drafts.map((d) => (
                <Pressable
                  key={d.id}
                  onPress={() => setSelectedDraft(d)}
                  className="p-4 rounded-2xl bg-surface-secondary border border-border-subtle flex-row items-center justify-between active:bg-surface-tertiary"
                  accessibilityLabel={`Expense item ${d.vendor}`}
                >
                  <View className="flex-1 mr-3">
                    <View className="flex-row items-center space-x-2 mb-1">
                      <Text className="text-sm font-bold text-content-primary">
                        {d.vendor}
                      </Text>
                      <Badge
                        variant={
                          d.status === "approved"
                            ? "success"
                            : d.status === "submitted"
                              ? "warning"
                              : "default"
                        }
                        size="sm"
                        label={
                          d.status === "approved"
                            ? "Approved"
                            : d.status === "submitted"
                              ? "Submitted"
                              : "Draft"
                        }
                      />
                    </View>
                    <Text className="text-xs text-content-secondary">
                      {d.date} · {d.category}
                    </Text>
                  </View>

                  <Text className="text-base font-extrabold text-content-primary">
                    ${d.amount.toFixed(2)}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        )}
      </ScrollView>

      {/* Modal */}
      <EmployeeExpenseDetailModal
        draft={selectedDraft}
        visible={!!selectedDraft}
        onClose={() => setSelectedDraft(null)}
      />
    </KeyboardAvoidingView>
  );
}
