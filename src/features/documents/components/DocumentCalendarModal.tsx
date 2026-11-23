import { useState } from "react";
import { Modal, Pressable, ScrollView, View } from "react-native";
import { Button } from "@/components/ui/Button";
import { DocumentCard } from "@/components/ui/DocumentCard";
import { UtilityIcon } from "@/components/ui/Icon";
import { Text } from "@/components/ui/Text";
import type { DocumentItem } from "../types";

export interface DocumentCalendarModalProps {
  documents: DocumentItem[];
  visible: boolean;
  onClose: () => void;
  onSelectDocument: (doc: DocumentItem) => void;
}

export function DocumentCalendarModal({
  documents,
  visible,
  onClose,
  onSelectDocument,
}: DocumentCalendarModalProps) {
  const [selectedMonth, setSelectedMonth] = useState<
    "October 2026" | "November 2026" | "December 2026"
  >("November 2026");
  const [selectedDay, setSelectedDay] = useState<number>(6);

  // Month navigation
  const handlePrevMonth = () => {
    if (selectedMonth === "December 2026") setSelectedMonth("November 2026");
    else if (selectedMonth === "November 2026")
      setSelectedMonth("October 2026");
  };

  const handleNextMonth = () => {
    if (selectedMonth === "October 2026") setSelectedMonth("November 2026");
    else if (selectedMonth === "November 2026")
      setSelectedMonth("December 2026");
  };

  // Mock document mapping per day
  const recordsOnDay: Record<number, number> = {
    1: 1, // Chase statement
    6: 1, // Home Depot receipt
    8: 2, // Invoice Riverbend & Branding estimate
    16: 3, // Uber trip & activity
  };

  const activeDayCount = recordsOnDay[selectedDay] ?? 0;

  // Filter documents active on selected day
  const filteredDayDocs = documents.filter((doc) => {
    if (selectedMonth !== "November 2026") return false;
    if (selectedDay === 6 && doc.date.includes("6")) return true;
    if (selectedDay === 8 && doc.date.includes("8")) return true;
    if (selectedDay === 1 && doc.date.includes("1")) return true;
    if (selectedDay === 16 && doc.date.includes("16")) return true;
    return false;
  });

  const daysInMonth =
    selectedMonth === "October 2026" || selectedMonth === "December 2026"
      ? 31
      : 30;
  const daysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1);

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
          {/* Header Figma 37:642 */}
          <View className="mb-4">
            <Text variant="Title" className="font-semibold text-text">
              Document calendar
            </Text>
            <Text variant="Caption" tone="muted" className="mt-1">
              Browse receipts, invoices, and statements by date
            </Text>
          </View>

          {/* Calendar Card Figma 37:642 / 220:878 */}
          <View className="mb-4 rounded-[14px] border border-border bg-surface p-4 shadow-sm">
            {/* Month Header with Chevrons */}
            <View className="mb-4 flex-row items-center justify-between">
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Previous month"
                onPress={handlePrevMonth}
                disabled={selectedMonth === "October 2026"}
                className={`p-2 rounded-full ${selectedMonth === "October 2026" ? "opacity-30" : "bg-surfaceAlt"}`}
              >
                <UtilityIcon name="chevron-left" size={16} />
              </Pressable>

              <Text
                variant="Heading"
                className="text-[17px] font-semibold text-text"
              >
                {selectedMonth}
              </Text>

              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Next month"
                onPress={handleNextMonth}
                disabled={selectedMonth === "December 2026"}
                className={`p-2 rounded-full ${selectedMonth === "December 2026" ? "opacity-30" : "bg-surfaceAlt"}`}
              >
                <UtilityIcon name="chevron-right" size={16} />
              </Pressable>
            </View>

            {/* Days Grid */}
            <View className="flex-row flex-wrap justify-between gap-y-2">
              {daysArray.map((day) => {
                const isSelected = selectedDay === day;
                const count = recordsOnDay[day] ?? 0;
                return (
                  <Pressable
                    key={day}
                    accessibilityRole="button"
                    accessibilityLabel={`Day ${day}, ${count} records`}
                    onPress={() => setSelectedDay(day)}
                    className={`h-[42px] w-[42px] items-center justify-center rounded-[10px] border ${
                      isSelected
                        ? "border-primary bg-primarySoft"
                        : "border-transparent bg-canvas"
                    }`}
                  >
                    <Text
                      variant="Caption"
                      className={`font-semibold ${isSelected ? "text-primary" : "text-text"}`}
                    >
                      {day}
                    </Text>
                    {count > 0 ? (
                      <View className="size-1.5 rounded-full bg-primary mt-0.5" />
                    ) : null}
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* Selected Date Summary Card */}
          <View className="mb-6 rounded-[14px] border border-border bg-surface p-4">
            <View className="mb-2 flex-row items-center justify-between">
              <Text variant="Section">
                {selectedMonth.split(" ")[0]} {selectedDay}, 2026
              </Text>
              <View className="rounded bg-primarySoft px-2 py-0.5">
                <Text variant="Caption" tone="primary">
                  {activeDayCount} {activeDayCount === 1 ? "record" : "records"}
                </Text>
              </View>
            </View>

            <View className="gap-2.5 mt-2">
              {filteredDayDocs.map((doc) => (
                <DocumentCard
                  key={doc.id}
                  filename={doc.filename}
                  type={doc.type}
                  status={doc.status}
                  date={doc.date}
                  fileTypeLabel={doc.fileTypeLabel}
                  onPress={() => onSelectDocument(doc)}
                />
              ))}

              {filteredDayDocs.length === 0 && (
                <Text variant="BodySmall" tone="muted" className="py-2">
                  No documents recorded on this date.
                </Text>
              )}
            </View>
          </View>

          <Button
            title="Back to documents"
            variant="secondary"
            onPress={onClose}
          />
        </ScrollView>
      </View>
    </Modal>
  );
}
