import { Pressable, type StyleProp, View, type ViewStyle } from "react-native";
import { typographyStyle } from "@/theme/tokens";
import { UtilityIcon } from "./Icon";
import { Text } from "./Text";

export type TransactionType = "Expense" | "Income";

export type TransactionRowProps = {
  type?: TransactionType;
  amount: string;
  merchant: string;
  categoryDate?: string;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  className?: string;
};

// Figma 6:33: LB / Transaction Row (height 81px, rounded-md 12px, border border-border, px-[12px..14px] py-[12px])
export function TransactionRow({
  type = "Expense",
  amount,
  merchant,
  categoryDate = type === "Income"
    ? "Client payment · Nov 5"
    : "Office supplies · Nov 6",
  onPress,
  style,
  className = "",
}: TransactionRowProps) {
  const isIncome = type === "Income";

  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole="button"
      accessibilityLabel={`${merchant}, ${amount}, ${categoryDate}`}
      className={`h-[81px] flex-row items-center gap-[11px] rounded-md border border-border bg-surface pl-[12px] pr-[14px] py-[12px] active:bg-surfaceAlt ${className}`}
      style={style}
    >
      {/* 39×39px icon avatar */}
      <View className="size-[39px] items-center justify-center rounded-[10px] bg-surfaceAlt">
        <UtilityIcon
          name={isIncome ? "transaction-income" : "transaction-expense"}
          size={22}
          color={isIncome ? "#137754" : "#13243C"}
        />
      </View>

      {/* Merchant info */}
      <View className="flex-1 justify-center gap-1">
        <Text
          variant="Label"
          tone="text"
          style={typographyStyle("Label")}
          numberOfLines={1}
        >
          {merchant}
        </Text>
        <Text
          variant="Caption"
          tone="muted"
          style={typographyStyle("Caption")}
          numberOfLines={1}
        >
          {categoryDate}
        </Text>
      </View>

      {/* Amount */}
      <Text
        variant="Label"
        tone={isIncome ? "positive" : "text"}
        style={typographyStyle("Label")}
      >
        {amount}
      </Text>
    </Pressable>
  );
}
