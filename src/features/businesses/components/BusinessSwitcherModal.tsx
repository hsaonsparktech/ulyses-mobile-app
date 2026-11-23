import { Modal, Pressable, ScrollView, View } from "react-native";
import { Button } from "@/components/ui/Button";
import { UtilityIcon } from "@/components/ui/Icon";
import { Text } from "@/components/ui/Text";
import { useBusinessStore } from "../store";

export interface BusinessSwitcherModalProps {
  visible: boolean;
  onClose: () => void;
  onAddBusiness?: () => void;
}

export function BusinessSwitcherModal({
  visible,
  onClose,
  onAddBusiness,
}: BusinessSwitcherModalProps) {
  const { businesses, activeBusinessId, setActiveBusinessId } =
    useBusinessStore();

  const handleSelect = async (id: string) => {
    await setActiveBusinessId(id);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable
        className="flex-1 justify-center bg-black/50 p-4"
        onPress={onClose}
      >
        <Pressable
          className="max-h-[85%] rounded-[18px] border border-border bg-surface p-5 shadow-lg"
          onPress={(e) => e.stopPropagation()}
        >
          <View className="mb-4 flex-row items-center justify-between">
            <View>
              <Text variant="Section">Active business</Text>
              <Text variant="Caption" tone="muted">
                Switch company workspace
              </Text>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Close"
              hitSlop={8}
              onPress={onClose}
              className="rounded-full bg-surfaceAlt p-2"
            >
              <UtilityIcon name="chevron-down" size={16} />
            </Pressable>
          </View>

          <ScrollView className="mb-4 gap-2">
            {businesses.map((biz) => {
              const isSelected = biz.id === activeBusinessId;
              const initial = biz.name.trim().charAt(0).toUpperCase() || "B";

              return (
                <Pressable
                  key={biz.id}
                  onPress={() => handleSelect(biz.id)}
                  accessibilityRole="button"
                  accessibilityLabel={`${biz.name}, ${isSelected ? "Currently selected" : "Tap to select"}`}
                  className={`mb-2 flex-row items-center gap-3 rounded-md border p-3 ${
                    isSelected
                      ? "border-primary bg-primarySoft/40"
                      : "border-border bg-surface active:bg-surfaceAlt"
                  }`}
                >
                  <View className="size-10 items-center justify-center rounded-md bg-primarySoft">
                    <Text variant="Label" tone="primary" className="font-bold">
                      {initial}
                    </Text>
                  </View>

                  <View className="flex-1">
                    <Text variant="Label" tone="text">
                      {biz.name}
                    </Text>
                    <Text variant="Caption" tone="muted">
                      {biz.type} · {biz.currency}
                    </Text>
                  </View>

                  {isSelected ? (
                    <View className="size-6 items-center justify-center rounded-full bg-primary">
                      <UtilityIcon
                        name="selection-check"
                        size={12}
                        color="#FFFFFF"
                      />
                    </View>
                  ) : null}
                </Pressable>
              );
            })}
          </ScrollView>

          <View className="gap-2">
            <Button
              title="+ Add business"
              variant="secondary"
              onPress={() => {
                onClose();
                onAddBusiness?.();
              }}
            />
            <Button title="Done" variant="primary" onPress={onClose} />
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
