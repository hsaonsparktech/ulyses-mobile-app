import { fireEvent, render } from "@testing-library/react-native";
import { ActivityScreen } from "@/features/transactions/screens/ActivityScreen";
import { ThemeProvider } from "@/theme/ThemeProvider";

describe("ActivityScreen (Figma 36:1000, 81:498, 89:552)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("renders summary, filter tabs, transactions list, detail modal, and add action", () => {
    const view = render(
      <ThemeProvider>
        <ActivityScreen />
      </ThemeProvider>,
    );

    // Title & summary
    expect(view.getByText("Activity")).toBeTruthy();
    expect(
      view.getByText("Income and expenses for this business"),
    ).toBeTruthy();
    expect(view.getByText("THIS MONTH")).toBeTruthy();

    // Filter tabs
    const allTab = view.getByLabelText("Filter: All");
    const incomeTab = view.getByLabelText("Filter: Income");
    const expenseTab = view.getByLabelText("Filter: Expenses");

    expect(allTab).toBeTruthy();
    expect(incomeTab).toBeTruthy();
    expect(expenseTab).toBeTruthy();

    // Recent transactions header & items
    expect(view.getByText("Recent transactions")).toBeTruthy();
    expect(view.getByText("Oak Street Supply")).toBeTruthy();

    // Filter by Income
    fireEvent.press(incomeTab);
    expect(view.queryByText("Oak Street Supply")).toBeNull();
    expect(view.getByText("Jackson Studio")).toBeTruthy();

    // Reset to All
    fireEvent.press(allTab);
    expect(view.getByText("Oak Street Supply")).toBeTruthy();

    // Open detail modal by pressing a transaction row
    const row = view.getByLabelText(
      "Oak Street Supply, −$128.40, Office supplies · Nov 6",
    );
    fireEvent.press(row);

    // Detail modal content (81:498)
    expect(view.getByText("Transaction details")).toBeTruthy();
    expect(view.getByText("Vendor / Merchant")).toBeTruthy();
    expect(view.getByText("receipt_nov06.pdf")).toBeTruthy();

    // Close detail modal
    const closeBtn = view.getByText("Close");
    fireEvent.press(closeBtn);

    // Open Add Expense modal
    const addExpenseBtn = view.getByText("+ Expense");
    fireEvent.press(addExpenseBtn);
    expect(view.getByText("Add Expense")).toBeTruthy();
  });
});
