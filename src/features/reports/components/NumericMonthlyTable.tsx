import { View } from "react-native";
import { Text } from "@/components/ui/Text";

export interface MonthlyRow {
  month: string;
  income: string;
  expense: string;
  net: string;
}

export const sixMonthTableRows: MonthlyRow[] = [
  { month: "Jun", income: "$7,200", expense: "$2,400", net: "$4,800" },
  { month: "Jul", income: "$8,850", expense: "$3,150", net: "$5,700" },
  { month: "Aug", income: "$9,300", expense: "$3,330", net: "$5,970" },
  { month: "Sep", income: "$10,100", expense: "$3,700", net: "$6,400" },
  { month: "Oct", income: "$11,500", expense: "$4,100", net: "$7,400" },
  { month: "Nov", income: "$12,480", expense: "$4,250", net: "$8,230" },
];

// Figma 224:942: Table / Six-month accessible values
export function NumericMonthlyTable() {
  return (
    <View className="gap-3">
      {/* Summary box (224:1058) */}
      <View className="rounded-[12px] bg-primarySoft p-3.5">
        <Text
          variant="Caption"
          tone="muted"
          className="uppercase font-semibold"
        >
          NOVEMBER NET PROFIT
        </Text>
        <Text variant="Title" tone="primary" className="text-2xl font-bold">
          $8,230
        </Text>
      </View>

      {/* Accessible data table (224:1061) */}
      <View
        accessibilityLabel="Six-month income, expense and net profit breakdown"
        className="rounded-[12px] border border-border bg-surface overflow-hidden"
      >
        {/* Table Header */}
        <View className="flex-row border-b border-border bg-surfaceAlt/60 px-3 py-2.5">
          <Text variant="Caption" tone="muted" className="w-16 font-semibold">
            MONTH
          </Text>
          <Text
            variant="Caption"
            tone="muted"
            className="flex-1 font-semibold text-right"
          >
            INCOME
          </Text>
          <Text
            variant="Caption"
            tone="muted"
            className="flex-1 font-semibold text-right"
          >
            EXPENSE
          </Text>
          <Text
            variant="Caption"
            tone="muted"
            className="flex-1 font-semibold text-right"
          >
            NET
          </Text>
        </View>

        {/* Rows with alternating backgrounds */}
        {sixMonthTableRows.map((row, index) => {
          const isAlt = index % 2 === 1;
          return (
            <View
              key={row.month}
              className={`flex-row items-center px-3 py-3 border-b border-border/40 ${
                isAlt ? "bg-surfaceAlt/40" : "bg-surface"
              }`}
            >
              <Text
                variant="BodySmall"
                tone="text"
                className="w-16 font-medium"
              >
                {row.month}
              </Text>
              <Text
                variant="BodySmall"
                tone="text"
                className="flex-1 text-right"
              >
                {row.income}
              </Text>
              <Text
                variant="BodySmall"
                tone="text"
                className="flex-1 text-right"
              >
                {row.expense}
              </Text>
              <Text
                variant="BodySmall"
                tone="primary"
                className="flex-1 text-right font-semibold"
              >
                {row.net}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}
