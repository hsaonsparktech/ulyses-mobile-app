import { ActivityIndicator, View } from "react-native";
import { Screen } from "@/components/layout/Screen";
import { Button } from "@/components/ui/Button";
import { FeedbackIcon, UtilityIcon } from "@/components/ui/Icon";
import { Text } from "@/components/ui/Text";
import { useThemeColors } from "@/theme/ThemeProvider";

export function LoadingState({
  message = "Processing request...",
  subtext = "This will take a moment",
}: {
  message?: string;
  subtext?: string;
}) {
  const colors = useThemeColors();
  return (
    <Screen>
      <View className="flex-1 items-center justify-center p-6">
        <View className="w-full max-w-sm items-center rounded-lg border border-border bg-surface p-6 shadow-sm">
          <View className="mb-4 size-12 items-center justify-center rounded-full bg-primarySoft">
            <FeedbackIcon variant="processing" size={28} />
          </View>
          <Text variant="Section" tone="text" className="mb-1 text-center">
            {message}
          </Text>
          <Text variant="Caption" tone="muted" className="mb-4 text-center">
            {subtext}
          </Text>
          <ActivityIndicator
            accessibilityLabel="Loading session"
            color={colors.primary}
            size="small"
          />
        </View>
      </View>
    </Screen>
  );
}

export function ErrorState({
  title = "Something went wrong",
  message,
  onRetry,
}: {
  title?: string;
  message: string;
  onRetry?: () => void;
}) {
  return (
    <View className="w-full rounded-lg border border-border bg-surface p-4">
      <View className="flex-row items-center gap-3">
        <View className="size-10 items-center justify-center rounded-full bg-negativeSoft">
          <FeedbackIcon variant="warning" size={24} />
        </View>
        <View className="flex-1">
          <Text variant="Label" tone="text">
            {title}
          </Text>
          <Text
            variant="BodySmall"
            tone="negative"
            accessibilityRole="alert"
            className="mt-0.5"
          >
            {message}
          </Text>
        </View>
      </View>
      {onRetry ? (
        <View className="mt-3">
          <Button title="Retry" variant="secondary" onPress={onRetry} />
        </View>
      ) : null}
    </View>
  );
}

export function EmptyState({
  title = "No records found",
  message,
  actionTitle,
  onAction,
}: {
  title?: string;
  message: string;
  actionTitle?: string;
  onAction?: () => void;
}) {
  return (
    <View className="items-center justify-center py-10 px-4">
      {/* Figma 81:1418: 107×107px primarySoft circle */}
      <View className="size-[107px] items-center justify-center rounded-full bg-primarySoft mb-4">
        <UtilityIcon name="add" size={40} />
      </View>
      <Text variant="Section" tone="text" className="mb-1 text-center">
        {title}
      </Text>
      <Text variant="BodySmall" tone="muted" className="max-w-xs text-center">
        {message}
      </Text>
      {actionTitle && onAction ? (
        <View className="mt-5 w-48">
          <Button title={actionTitle} variant="primary" onPress={onAction} />
        </View>
      ) : null}
    </View>
  );
}
