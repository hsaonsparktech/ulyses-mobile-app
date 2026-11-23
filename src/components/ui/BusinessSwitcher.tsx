import { Pressable, type StyleProp, View, type ViewStyle } from "react-native";
import { typographyStyle } from "@/theme/tokens";
import { UtilityIcon } from "./Icon";
import { Text } from "./Text";

export type BusinessSwitcherState = "Closed" | "Expanded";

export type BusinessSwitcherProps = {
  business?: string;
  state?: BusinessSwitcherState;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  className?: string;
};

// Figma 6:48: LB / Business Switcher (height 68px, rounded-md 12px, border border-border, px-[14px] py-[12px])
export function BusinessSwitcher({
  business = "Acme Services",
  state = "Closed",
  onPress,
  style,
  className = "",
}: BusinessSwitcherProps) {
  const isExpanded = state === "Expanded";
  const initial = business.trim().charAt(0).toUpperCase() || "A";

  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole="button"
      accessibilityLabel={`Active business: ${business}. ${isExpanded ? "Expanded" : "Tap to switch business"}`}
      accessibilityState={{ expanded: isExpanded }}
      className={`h-[68px] flex-row items-center gap-[12px] rounded-md border border-border bg-surface px-[14px] py-[12px] active:bg-surfaceAlt ${className}`}
      style={style}
    >
      {/* 43×43px business avatar */}
      <View className="size-[43px] items-center justify-center rounded-md bg-primarySoft">
        <Text
          variant="Section"
          tone="primary"
          style={typographyStyle("Section")}
        >
          {initial}
        </Text>
      </View>

      {/* Business labels */}
      <View className="flex-1 justify-center gap-0.5">
        <Text
          variant="Caption"
          tone="muted"
          style={typographyStyle("Caption")}
          className="uppercase tracking-wider"
        >
          ACTIVE BUSINESS
        </Text>
        <Text
          variant="Label"
          tone="text"
          style={typographyStyle("Label")}
          numberOfLines={1}
        >
          {business}
        </Text>
      </View>

      {/* Right chevron indicator */}
      <View
        style={{
          transform: [{ rotate: isExpanded ? "180deg" : "0deg" }],
        }}
      >
        <UtilityIcon name="chevron-down" size={18} />
      </View>
    </Pressable>
  );
}
