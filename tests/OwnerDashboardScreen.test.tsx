import { fireEvent, render } from "@testing-library/react-native";
import { OwnerDashboardScreen } from "@/features/dashboard/screens/OwnerDashboardScreen";
import { ThemeProvider } from "@/theme/ThemeProvider";

const mockPush = jest.fn();

jest.mock("expo-router", () => ({
  useRouter: () => ({
    push: mockPush,
    replace: jest.fn(),
  }),
}));

describe("OwnerDashboardScreen (Figma 36:519 & 37:1003)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("renders header, switcher, overview, estimated profit, metric cards, quick actions, and recent activity", () => {
    const view = render(
      <ThemeProvider>
        <OwnerDashboardScreen />
      </ThemeProvider>,
    );

    // Header & brand
    expect(view.getByText("Libros")).toBeTruthy();
    expect(view.getByLabelText("Notifications")).toBeTruthy();

    // Active Business Switcher
    expect(view.getByText("Acme Services LLC")).toBeTruthy();

    // Financial overview & calendar shortcut
    expect(view.getByText("Financial overview")).toBeTruthy();
    expect(view.getByLabelText("Calendar period filter")).toBeTruthy();

    // Hero Estimated Profit Card (36:528)
    expect(view.getByText("ESTIMATED PROFIT")).toBeTruthy();
    expect(view.getByText("Income minus expenses this month")).toBeTruthy();

    // Metric Cards (199:1876)
    expect(view.getByText("Income")).toBeTruthy();
    expect(view.getByText("Expenses")).toBeTruthy();

    // Quick Actions (199:1877)
    expect(view.getByText("Quick actions")).toBeTruthy();
    const scanBtn = view.getByLabelText("Scan document");
    const invoiceBtn = view.getByLabelText("Create invoice");
    const reportsBtn = view.getByLabelText("View reports");

    fireEvent.press(scanBtn);
    expect(mockPush).toHaveBeenCalledWith("/owner/documents");

    fireEvent.press(invoiceBtn);
    expect(mockPush).toHaveBeenCalledWith("/owner/invoices");

    fireEvent.press(reportsBtn);
    expect(mockPush).toHaveBeenCalledWith("/owner/reports");

    // Recent activity (36:544)
    expect(view.getByText("Recent activity")).toBeTruthy();
    const seeAllBtn = view.getByLabelText("See all activity");
    fireEvent.press(seeAllBtn);
    expect(mockPush).toHaveBeenCalledWith("/owner/activity");
  });
});
