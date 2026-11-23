import { useEffect, useState } from "react";
import { ActivityIndicator, Modal, Text, View } from "react-native";
import { SvgIcon } from "@/components/ui/SvgIcon";
import { useScanStore } from "../store";

export function ScanProcessingModal() {
  const isProcessing = useScanStore((s) => s.isProcessing);
  const [stepIndex, setStepIndex] = useState(0);

  const steps = [
    "Detecting document boundaries...",
    "Extracting text & numeric values...",
    "Reconciling totals and merchant info...",
  ];

  useEffect(() => {
    if (!isProcessing) {
      setStepIndex(0);
      return;
    }
    const timer1 = setTimeout(() => setStepIndex(1), 400);
    const timer2 = setTimeout(() => setStepIndex(2), 800);
    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, [isProcessing]);

  return (
    <Modal visible={isProcessing} transparent animationType="fade">
      <View className="flex-1 bg-black/70 items-center justify-center px-8">
        <View className="w-full max-w-sm bg-surface-primary rounded-3xl p-6 items-center shadow-2xl border border-border-subtle">
          <View className="w-16 h-16 rounded-full bg-brand-primary/10 items-center justify-center mb-5">
            <ActivityIndicator size="large" color="#1570EF" />
          </View>

          <Text className="text-lg font-bold text-content-primary mb-2 text-center">
            Libros AI Smart Scan
          </Text>
          <Text className="text-xs text-content-secondary mb-6 text-center">
            Processing document with edge OCR engine...
          </Text>

          <View className="w-full space-y-3 bg-surface-secondary rounded-2xl p-4">
            {steps.map((label, index) => {
              const isCompleted = stepIndex > index;
              const isCurrent = stepIndex === index;
              return (
                <View key={label} className="flex-row items-center space-x-3">
                  <View
                    className={`w-5 h-5 rounded-full items-center justify-center ${
                      isCompleted
                        ? "bg-feedback-success"
                        : isCurrent
                          ? "bg-brand-primary"
                          : "bg-surface-tertiary"
                    }`}
                  >
                    {isCompleted ? (
                      <SvgIcon
                        name="check"
                        size={12}
                        color="#FFFFFF"
                        strokeWidth={3}
                      />
                    ) : isCurrent ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <View className="w-1.5 h-1.5 rounded-full bg-content-disabled" />
                    )}
                  </View>
                  <Text
                    className={`text-xs flex-1 ${
                      isCurrent
                        ? "font-semibold text-content-primary"
                        : isCompleted
                          ? "text-content-secondary"
                          : "text-content-disabled"
                    }`}
                  >
                    {label}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>
      </View>
    </Modal>
  );
}
