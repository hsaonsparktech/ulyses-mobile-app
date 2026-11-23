import { View } from "react-native";
import { Text } from "@/components/ui/Text";
import { typographyStyle } from "@/theme/tokens";

export interface EstimatedProfitCardProps {
  amount: string;
  periodDescription?: string;
}

// Figma 36:528: Hero / Estimated profit (height 143px, rounded-[18px], bg-primary, p-[18px])
export function EstimatedProfitCard({
  amount,
  periodDescription = "Income minus expenses this month",
}: EstimatedProfitCardProps) {
  return (
    <View
      accessibilityRole="summary"
      accessibilityLabel={`Estimated profit: ${amount}. ${periodDescription}`}
      className="h-[143px] justify-between rounded-[18px] bg-primary p-[18px]"
    >
      <Text
        variant="Caption"
        className="text-white/80 uppercase tracking-wider"
        style={typographyStyle("Caption")}
      >
        ESTIMATED PROFIT
      </Text>

      <Text
        variant="Amount"
        className="font-bold text-white text-[32px] leading-[40px]"
        style={typographyStyle("Amount")}
      >
        {amount}
      </Text>

      <Text
        variant="Caption"
        className="text-white/80"
        style={typographyStyle("Caption")}
      >
        {periodDescription}
      </Text>
    </View>
  );
}
