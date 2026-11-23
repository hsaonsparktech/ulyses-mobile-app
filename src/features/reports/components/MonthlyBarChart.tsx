import { Pressable, View } from "react-native";
import { Text } from "@/components/ui/Text";

export interface MonthlyBarData {
  month: string;
  income: number;
  expense: number;
}

export const sixMonthTrend: MonthlyBarData[] = [
  { month: "Jun", income: 7200, expense: 2400 },
  { month: "Jul", income: 8850, expense: 3150 },
  { month: "Aug", income: 9300, expense: 3330 },
  { month: "Sep", income: 10100, expense: 3700 },
  { month: "Oct", income: 11500, expense: 4100 },
  { month: "Nov", income: 12480, expense: 4250 },
];

export interface MonthlyBarChartProps {
  data?: MonthlyBarData[];
  onToggleTable?: () => void;
  tableVisible?: boolean;
}

// Figma 36:830: Card / Income vs expenses (height 143px, rounded-[16px], border border-border, bg-surface)
export function MonthlyBarChart({
  data = sixMonthTrend,
  onToggleTable,
  tableVisible = false,
}: MonthlyBarChartProps) {
  const maxVal = Math.max(...data.map((d) => Math.max(d.income, d.expense)));

  return (
    <View className="rounded-[16px] border border-border bg-surface p-4">
      {/* Top Header & Legend */}
      <View className="mb-3 flex-row items-center justify-between">
        <Text
          variant="Caption"
          tone="muted"
          className="uppercase tracking-wider"
        >
          JUN–NOV · USD
        </Text>

        <View className="flex-row items-center gap-3">
          <View className="flex-row items-center gap-1.5">
            <View className="size-2 rounded-full bg-positive" />
            <Text variant="Caption" tone="positive">
              Income
            </Text>
          </View>

          <View className="flex-row items-center gap-1.5">
            <View className="size-2 rounded-full bg-muted" />
            <Text variant="Caption" tone="muted">
              Expenses
            </Text>
          </View>

          {/* Accessible Data Toggle (Figma 223:988 / 241:974: 60x44 tap target) */}
          {onToggleTable ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={
                tableVisible ? "Hide numeric data" : "View numeric monthly data"
              }
              hitSlop={8}
              onPress={onToggleTable}
              className="min-h-[44px] min-w-[50px] items-center justify-center pl-1"
            >
              <Text variant="Caption" tone="primary" className="font-semibold">
                {tableVisible ? "Chart ‹" : "Data ›"}
              </Text>
            </Pressable>
          ) : null}
        </View>
      </View>

      {/* 6-Month Bar Columns */}
      <View className="h-28 flex-row items-end justify-between px-1">
        {data.map((item) => {
          const incomeHeight = Math.max(16, (item.income / maxVal) * 80);
          const expenseHeight = Math.max(12, (item.expense / maxVal) * 80);

          return (
            <View key={item.month} className="items-center gap-1">
              <View className="flex-row items-end gap-1">
                {/* Income Bar */}
                <View
                  style={{ height: incomeHeight }}
                  className="w-3 rounded-[3px] bg-primary"
                />
                {/* Expense Bar */}
                <View
                  style={{ height: expenseHeight }}
                  className="w-3 rounded-[3px] bg-accent"
                />
              </View>
              <Text variant="Caption" tone="muted">
                {item.month}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}
