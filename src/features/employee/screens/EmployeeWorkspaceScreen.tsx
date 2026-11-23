import { useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { LibrosLogo } from "@/components/ui/LibrosLogo";
import { SvgIcon } from "@/components/ui/SvgIcon";
import { EmployeeExpenseDetailModal } from "../components/EmployeeExpenseDetailModal";
import { useEmployeeStore } from "../store";
import type { ExpenseDraft } from "../types";

export function EmployeeWorkspaceScreen() {
  const router = useRouter();
  const drafts = useEmployeeStore((s) => s.drafts);
  const [selectedDraft, setSelectedDraft] = useState<ExpenseDraft | null>(null);

  const savedDrafts = drafts.filter((d) => d.status === "draft").slice(0, 3);

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
        {/* Title & subtitle */}
        <View className="mb-5">
          <Text className="text-2xl font-bold text-content-primary">
            Your workspace
          </Text>
          <Text className="text-xs text-content-secondary mt-1">
            Acme Services · Employee access
          </Text>
        </View>

        {/* Authorized Business Card Figma 41:32 */}
        <View className="bg-surface-secondary rounded-2xl p-4 border border-border-subtle mb-6 relative">
          <View className="flex-row items-center justify-between mb-1">
            <Text className="text-xs font-bold text-content-secondary uppercase tracking-wider">
              AUTHORIZED BUSINESS
            </Text>
            <View className="w-7 h-7 rounded-full bg-brand-primary/10 items-center justify-center">
              <SvgIcon name="shield" size={16} color="#1570EF" />
            </View>
          </View>

          <Text className="text-lg font-bold text-content-primary mb-1">
            Acme Services LLC
          </Text>
          <Text className="text-xs text-content-secondary">
            You only see tools your owner has granted.
          </Text>
        </View>

        {/* Quick Actions Card Figma 41:37 */}
        <Text className="text-base font-bold text-content-primary mb-3">
          Quick actions
        </Text>

        <View className="bg-surface-secondary rounded-2xl p-4 border border-border-subtle mb-6">
          <Pressable
            onPress={() => router.navigate("/employee/documents")}
            className="flex-row items-center justify-between pb-3.5 border-b border-border-subtle active:opacity-70"
            accessibilityLabel="Upload receipt"
          >
            <View>
              <Text className="text-sm font-bold text-content-primary">
                Upload receipt
              </Text>
              <Text className="text-xs text-content-secondary mt-0.5">
                Attach a business expense document
              </Text>
            </View>
            <View className="w-9 h-9 rounded-xl bg-brand-primary/10 items-center justify-center">
              <SvgIcon name="camera" size={18} color="#1570EF" />
            </View>
          </Pressable>

          <Pressable
            onPress={() => router.navigate("/employee/expenses")}
            className="pt-3.5 flex-row items-center justify-between active:opacity-70"
            accessibilityLabel="New expense draft"
          >
            <Text className="text-sm font-bold text-brand-primary">
              + New expense draft
            </Text>
            <SvgIcon name="chevron-right" size={16} color="#1570EF" />
          </Pressable>
        </View>

        {/* Recent Drafts List Figma 41:42 */}
        <View className="flex-row items-center justify-between mb-3">
          <Text className="text-base font-bold text-content-primary">
            My recent drafts
          </Text>
          <Pressable onPress={() => router.navigate("/employee/expenses")}>
            <Text className="text-xs font-semibold text-brand-primary">
              View all ({drafts.length}) →
            </Text>
          </Pressable>
        </View>

        <View className="space-y-3">
          {savedDrafts.map((draft) => (
            <Pressable
              key={draft.id}
              onPress={() => setSelectedDraft(draft)}
              className="p-3.5 rounded-2xl bg-surface-secondary border border-border-subtle flex-row items-center justify-between active:bg-surface-tertiary"
              accessibilityLabel={`Draft ${draft.vendor}, $${draft.amount.toFixed(2)}`}
            >
              <View className="flex-row items-center space-x-3 flex-1 mr-3">
                <View className="w-8 h-8 rounded-lg bg-surface-tertiary items-center justify-center border border-border-subtle">
                  <SvgIcon name="file-text" size={16} color="#6B7280" />
                </View>
                <View className="flex-1">
                  <Text
                    className="text-sm font-bold text-content-primary"
                    numberOfLines={1}
                  >
                    {draft.vendor}
                  </Text>
                  <Text className="text-xs text-content-secondary mt-0.5">
                    {draft.date} · Saved draft
                  </Text>
                </View>
              </View>

              <Text className="text-sm font-extrabold text-content-primary">
                ${draft.amount.toFixed(2)}
              </Text>
            </Pressable>
          ))}
        </View>
      </ScrollView>

      {/* Modal */}
      <EmployeeExpenseDetailModal
        draft={selectedDraft}
        visible={!!selectedDraft}
        onClose={() => setSelectedDraft(null)}
      />
    </View>
  );
}
