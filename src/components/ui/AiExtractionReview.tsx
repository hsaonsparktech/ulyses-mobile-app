import { Pressable, type StyleProp, View, type ViewStyle } from "react-native";
import { typographyStyle } from "@/theme/tokens";
import { Text } from "./Text";

export type AiExtractionState = "Needs Review" | "Confirmed";

export type AiExtractionReviewProps = {
  state?: AiExtractionState;
  title?: string;
  summary?: string;
  guidanceText?: string;
  businessName?: string;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  className?: string;
};

// Figma 6:78: LB / AI Extraction Review (height 146px, rounded-lg 16px, border border-border, px-[14px] pt-[19px] pb-[12px])
export function AiExtractionReview({
  state = "Needs Review",
  title = state === "Confirmed" ? "Extraction saved" : "Review extraction",
  summary = "Vendor · Date · Amount · Category",
  guidanceText,
  businessName = "Acme Services",
  onPress,
  style,
  className = "",
}: AiExtractionReviewProps) {
  const isConfirmed = state === "Confirmed";
  const defaultGuidance = isConfirmed
    ? `Saved to ${businessName}.`
    : "Confirm before adding to your records.";
  const resolvedGuidance = guidanceText ?? defaultGuidance;

  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole="summary"
      accessibilityLabel={`AI Extraction: ${title}, ${summary}, ${resolvedGuidance}`}
      className={`h-[146px] flex-col justify-between rounded-lg border border-border bg-surface px-[14px] pb-[12px] pt-[19px] active:bg-surfaceAlt ${className}`}
      style={style}
    >
      <View className="gap-1">
        <Text
          variant="Section"
          tone="text"
          style={typographyStyle("Section")}
          numberOfLines={1}
        >
          {title}
        </Text>
        <Text
          variant="BodySmall"
          tone="muted"
          style={typographyStyle("BodySmall")}
          numberOfLines={1}
        >
          {summary}
        </Text>
      </View>

      {/* 40px guidance pill */}
      <View
        className={`h-10 items-center justify-center rounded-[10px] px-[10px] py-1 ${
          isConfirmed ? "bg-positiveSoft" : "bg-warningSoft"
        }`}
      >
        <Text
          variant="Caption"
          tone={isConfirmed ? "positive" : "warning"}
          style={typographyStyle("Caption")}
          numberOfLines={1}
        >
          {resolvedGuidance}
        </Text>
      </View>
    </Pressable>
  );
}
