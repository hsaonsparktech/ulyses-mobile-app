import { fireEvent, render } from "@testing-library/react-native";
import { OwnerReportsScreen } from "@/features/reports/screens/OwnerReportsScreen";
import { ThemeProvider } from "@/theme/ThemeProvider";

describe("OwnerReportsScreen (Figma 36:812, 224:942, 81:1303, 81:1262)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("renders reports view, toggles accessible numeric table, expands vendor spending, and opens export modal", () => {
    const view = render(
      <ThemeProvider>
        <OwnerReportsScreen />
      </ThemeProvider>,
    );

    // Header & summary
    expect(view.getByText("Financial reports")).toBeTruthy();
    expect(view.getByText("Understand your business at a glance")).toBeTruthy();
    expect(view.getByText("NET PROFIT / NOVEMBER")).toBeTruthy();
    expect(view.getByText("$8,230.00")).toBeTruthy();

    // Chips
    expect(view.getByLabelText("View: Nov 2026")).toBeTruthy();
    expect(view.getByLabelText("View: P&L report")).toBeTruthy();
    expect(view.getByLabelText("View: Vendors")).toBeTruthy();

    // 6-Month bar chart
    expect(view.getByText("JUN–NOV · USD")).toBeTruthy();
    expect(view.getByText("Jun")).toBeTruthy();
    expect(view.getByText("Nov")).toBeTruthy();

    // Toggle numeric table (224:942)
    const toggleBtn = view.getByLabelText("View numeric monthly data");
    fireEvent.press(toggleBtn);

    // Table is now visible
    expect(
      view.getByLabelText("Six-month income, expense and net profit breakdown"),
    ).toBeTruthy();
    expect(view.getByText("NOVEMBER NET PROFIT")).toBeTruthy();
    expect(view.getByText("MONTH")).toBeTruthy();
    expect(view.getByText("INCOME")).toBeTruthy();
    expect(view.getByText("EXPENSE")).toBeTruthy();
    expect(view.getByText("NET")).toBeTruthy();

    // Top vendor card (36:852) & expansion (81:1303)
    expect(view.getByText("TOP VENDOR THIS MONTH")).toBeTruthy();
    expect(view.getByText("Metro Utilities")).toBeTruthy();
    expect(view.getByText("$342.00")).toBeTruthy();

    const vendorCard = view.getByLabelText(
      "Top vendor: Metro Utilities, $342.00. Tap to expand breakdown.",
    );
    fireEvent.press(vendorCard);

    // Expanded vendor list
    expect(view.getByText("All Vendor Spending · Nov 2026")).toBeTruthy();
    expect(view.getByText("Cloud Platforms Inc")).toBeTruthy();
    expect(view.getByText("Oak Street Supply")).toBeTruthy();

    // Export PDF modal (81:1262)
    const exportBtn = view.getByText("Export PDF");
    fireEvent.press(exportBtn);

    expect(view.getByText("Export report")).toBeTruthy();
    expect(view.getByText("Select export format")).toBeTruthy();
    expect(view.getByText("Generate export")).toBeTruthy();
  });
});
