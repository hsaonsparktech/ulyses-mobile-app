import { fireEvent, render, screen } from "@testing-library/react-native";
import { AccountantAccountScreen } from "@/features/accountant/screens/AccountantAccountScreen";
import { AccountantDocumentsScreen } from "@/features/accountant/screens/AccountantDocumentsScreen";
import { AccountantOverviewScreen } from "@/features/accountant/screens/AccountantOverviewScreen";
import { AccountantReportsScreen } from "@/features/accountant/screens/AccountantReportsScreen";

// Mock router
jest.mock("expo-router", () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
  }),
}));

// Mock SessionProvider
jest.mock("@/providers/SessionProvider", () => ({
  useSession: () => ({
    session: {
      userId: "test-cpa-1",
      role: "accountant",
      businessId: "biz-1",
    },
    signOut: jest.fn().mockResolvedValue(undefined),
  }),
}));

describe("Accountant Role Workspace (Figma Page 20:5)", () => {
  it("renders Accountant Overview Screen (41:294)", () => {
    render(<AccountantOverviewScreen />);

    expect(screen.getByText("Libros")).toBeTruthy();
    expect(screen.getByText("ACCOUNTANT")).toBeTruthy();
    expect(screen.getByText("Overview")).toBeTruthy();
    expect(screen.getByText("BUSINESS-SCOPED ACCESS")).toBeTruthy();
    expect(screen.getByText("Acme Services LLC")).toBeTruthy();
    expect(screen.getByText("TOTAL INCOME")).toBeTruthy();
    expect(screen.getByText("$48,250")).toBeTruthy();
    expect(screen.getByText("TOTAL EXPENSES")).toBeTruthy();
    expect(screen.getByText("$19,430")).toBeTruthy();
    expect(screen.getByText("ESTIMATED NET PROFIT")).toBeTruthy();
    expect(screen.getByText("$28,820.00")).toBeTruthy();
    expect(screen.getByText("Accounting shortcuts")).toBeTruthy();
  });

  it("renders Accountant Reports Screen (41:324 & 224:1271)", () => {
    render(<AccountantReportsScreen />);

    expect(screen.getByText("Financial Reports")).toBeTruthy();
    expect(screen.getByText("Export")).toBeTruthy();
    expect(screen.getByText("Profit & Loss Statement")).toBeTruthy();
    expect(screen.getByText("Gross Revenue")).toBeTruthy();
    expect(screen.getByText("Gross Profit")).toBeTruthy();
    expect(screen.getByText("Net Income")).toBeTruthy();
    expect(screen.getByText("6-Month Financial Trend")).toBeTruthy();

    // Toggle numeric breakdown table (Figma 224:1271)
    fireEvent.press(screen.getByText("Show numeric breakdown table"));
    expect(screen.getByText("Hide numeric breakdown table")).toBeTruthy();
    expect(screen.getByText("Month")).toBeTruthy();

    // Vendor spending card
    expect(screen.getByText("Top Vendor Spending")).toBeTruthy();
    expect(screen.getByText("View All Vendor Spending")).toBeTruthy();
  });

  it("renders Accountant Documents Screen (41:425 & 41:431)", () => {
    render(<AccountantDocumentsScreen />);

    expect(screen.getByText("Documents")).toBeTruthy();
    expect(screen.getByText("Filter by classification")).toBeTruthy();
    expect(screen.getByText("Statement")).toBeTruthy();
    expect(screen.getByText("Tax Filing")).toBeTruthy();
    expect(screen.getByText(/Client files/)).toBeTruthy();
  });

  it("renders Accountant Account Profile Screen (84:205)", () => {
    render(<AccountantAccountScreen />);

    expect(screen.getByText("Accountant profile")).toBeTruthy();
    expect(screen.getByText("Acme Services LLC")).toBeTruthy();
    expect(screen.getByText("Accountant Scope Matrix")).toBeTruthy();
    expect(
      screen.getByText("View Financial Statements & Ledgers"),
    ).toBeTruthy();
    expect(screen.getByText("Export Session Audit Log")).toBeTruthy();
    expect(screen.getByText("Sign Out")).toBeTruthy();
  });
});
