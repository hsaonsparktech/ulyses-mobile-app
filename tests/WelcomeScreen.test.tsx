import { fireEvent, render } from "@testing-library/react-native";
import { WelcomeScreen } from "@/features/auth/screens/WelcomeScreen";
import { ThemeProvider } from "@/theme/ThemeProvider";

const mockPush = jest.fn();

jest.mock("expo-router", () => ({
  useRouter: () => ({
    push: mockPush,
    replace: jest.fn(),
  }),
}));

describe("WelcomeScreen (Figma 36:402)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("renders official brand header, heading, specimen preview and actions", () => {
    const view = render(
      <ThemeProvider>
        <WelcomeScreen />
      </ThemeProvider>,
    );

    expect(view.getByText("Libros")).toBeTruthy();
    expect(view.getByText("Welcome to Libros")).toBeTruthy();
    expect(
      view.getByText("Simple accounting for every business you manage."),
    ).toBeTruthy();

    // Specimen card
    expect(view.getByText("Your business, organized.")).toBeTruthy();
    expect(view.getByText("Specimen preview")).toBeTruthy();
    expect(view.getByText("Income")).toBeTruthy();
    expect(view.getByText("$12,480")).toBeTruthy();
    expect(view.getByText("Expenses")).toBeTruthy();
    expect(view.getByText("$4,250")).toBeTruthy();
    expect(view.getByText("AI assisted. Always reviewed.")).toBeTruthy();

    // Actions
    const createBtn = view.getByText("Create account");
    fireEvent.press(createBtn);
    expect(mockPush).toHaveBeenCalledWith("/(auth)/register");

    const signInBtn = view.getByText("Sign in");
    fireEvent.press(signInBtn);
    expect(mockPush).toHaveBeenCalledWith("/(auth)/sign-in");

    const accessCodeLink = view.getByLabelText("Use access code");
    fireEvent.press(accessCodeLink);
    expect(mockPush).toHaveBeenCalledWith("/(auth)/invite-code");
  });
});
