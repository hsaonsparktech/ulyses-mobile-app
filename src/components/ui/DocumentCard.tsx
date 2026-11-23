import { Pressable, type StyleProp, View, type ViewStyle } from "react-native";
import { typographyStyle } from "@/theme/tokens";
import { Text } from "./Text";

export type DocumentType = "Receipt" | "Statement" | "Invoice";

export type DocumentCardProps = {
  filename: string;
  type?: DocumentType;
  status?: string;
  date?: string;
  fileTypeLabel?: string;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  className?: string;
};

// Figma 6:67: LB / Document Card (height 84px, rounded-md 12px, border border-border, px-[14px] py-[12px])
export function DocumentCard({
  filename,
  type = "Receipt",
  status = type === "Statement" ? "Processing" : "Ready",
  date = "Nov 6",
  fileTypeLabel = "PDF",
  onPress,
  style,
  className = "",
}: DocumentCardProps) {
  const subtitle = `${type} · ${status} · ${date}`;

  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole="button"
      accessibilityLabel={`Document: ${filename}, ${subtitle}`}
      className={`h-[84px] flex-row items-center gap-[12px] rounded-md border border-border bg-surface px-[14px] py-[12px] active:bg-surfaceAlt ${className}`}
      style={style}
    >
      {/* 48×54px file icon container */}
      <View className="h-[54px] w-[48px] items-center justify-center rounded-[10px] bg-surfaceAlt">
        <Text
          variant="Caption"
          tone="primary"
          style={typographyStyle("Caption")}
          className="font-semibold"
        >
          {fileTypeLabel}
        </Text>
      </View>

      {/* Document info */}
      <View className="flex-1 justify-center gap-1">
        <Text
          variant="Label"
          tone="text"
          style={typographyStyle("Label")}
          numberOfLines={1}
        >
          {filename}
        </Text>
        <Text
          variant="Caption"
          tone="muted"
          style={typographyStyle("Caption")}
          numberOfLines={1}
        >
          {subtitle}
        </Text>
      </View>
    </Pressable>
  );
}
