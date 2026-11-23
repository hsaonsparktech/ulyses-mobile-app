import { fireEvent, render, screen } from "@testing-library/react-native";
import { EmployeeAccountScreen } from "@/features/employee/screens/EmployeeAccountScreen";
import { EmployeeDocumentsScreen } from "@/features/employee/screens/EmployeeDocumentsScreen";
import { EmployeeExpensesScreen } from "@/features/employee/screens/EmployeeExpensesScreen";
import { EmployeeWorkspaceScreen } from "@/features/employee/screens/EmployeeWorkspaceScreen";

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
      userId: "test-emp-1",
      role: "employee",
      businessId: "biz-1",
    },
    signOut: jest.fn().mockResolvedValue(undefined),
  }),
}));

describe("Employee Role Workspace (Figma Page 20:4)", () => {
  it("renders Employee Workspace Screen (41:26)", () => {
    render(<EmployeeWorkspaceScreen />);

    expect(screen.getByText("Libros")).toBeTruthy();
    expect(screen.getByText("EMPLOYEE")).toBeTruthy();
    expect(screen.getByText("Your workspace")).toBeTruthy();
    expect(screen.getByText("AUTHORIZED BUSINESS")).toBeTruthy();
    expect(screen.getByText("Acme Services LLC")).toBeTruthy();
    expect(screen.getByText("Quick actions")).toBeTruthy();
    expect(screen.getByText("Upload receipt")).toBeTruthy();
    expect(screen.getByText("+ New expense draft")).toBeTruthy();
    expect(screen.getByText("My recent drafts")).toBeTruthy();
  });

  it("renders Employee Expenses Screen (41:61 & 41:120)", () => {
    render(<EmployeeExpensesScreen />);

    expect(screen.getByText("Expense draft")).toBeTruthy();
    expect(
      screen.getByPlaceholderText("Enter merchant or vendor name"),
    ).toBeTruthy();
    expect(screen.getByPlaceholderText("0.00")).toBeTruthy();
    expect(screen.getByText("Save expense draft")).toBeTruthy();

    // Toggle to history feed
    fireEvent.press(screen.getByText(/Expense History/));
    expect(screen.getByText("My Expenses")).toBeTruthy();

    // Toggle back to new and save draft
    fireEvent.press(screen.getByText(/\+ New Expense Draft/));
    fireEvent.press(screen.getByText("Save expense draft"));
    expect(screen.getByText("Draft submitted")).toBeTruthy();
    expect(screen.getByText("Expense draft saved")).toBeTruthy();
  });

  it("renders Employee Documents Screen (41:152 & 41:164)", () => {
    render(<EmployeeDocumentsScreen />);

    expect(screen.getByText("Documents")).toBeTruthy();
    expect(screen.getByText("Filter by type")).toBeTruthy();
    expect(screen.getByText("+ Upload")).toBeTruthy();
    expect(screen.getByText(/Available files/)).toBeTruthy();
  });

  it("renders Employee Access Profile Screen (41:184 & 41:200)", () => {
    render(<EmployeeAccountScreen />);

    expect(screen.getByText("Access profile")).toBeTruthy();
    expect(screen.getByText("Acme Services LLC")).toBeTruthy();
    expect(screen.getByText("Your permissions")).toBeTruthy();
    expect(screen.getByText("Create expense drafts")).toBeTruthy();
    expect(screen.getByText("Request Elevated Access")).toBeTruthy();
    expect(screen.getByText("Sign Out")).toBeTruthy();
  });
});
