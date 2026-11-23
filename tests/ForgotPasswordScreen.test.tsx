import { fireEvent, render, waitFor } from "@testing-library/react-native";
import { ForgotPasswordScreen } from "@/features/auth/screens/ForgotPasswordScreen";
import { ThemeProvider } from "@/theme/ThemeProvider";

const mockPush = jest.fn();

jest.mock("expo-router", () => ({
  useRouter: () => ({
    push: mockPush,
    replace: jest.fn(),
  }),
}));

describe("ForgotPasswordScreen (Figma 36:1074 & 89:514)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("renders reset form and security notice, then transitions to confirmation state", async () => {
    const view = render(
      <ThemeProvider>
        <ForgotPasswordScreen />
      </ThemeProvider>,
    );

    expect(view.getByText("Reset password")).toBeTruthy();
    expect(
      view.getByText("We'll send a secure reset link to your email."),
    ).toBeTruthy();
    expect(view.getByText("Protect your account")).toBeTruthy();

    const emailInput = view.getByLabelText("Email address");
    fireEvent.changeText(emailInput, "user@example.com");

    const sendBtn = view.getByText("Send reset link");
    fireEvent.press(sendBtn);

    // Transition to confirmation state (89:514)
    await waitFor(() => {
      expect(view.getByText("Check your email")).toBeTruthy();
      expect(view.getByText("Reset instructions prepared")).toBeTruthy();
      expect(view.getByText("Return to sign in")).toBeTruthy();
      expect(view.getByText("Back to welcome")).toBeTruthy();
    });

    const returnBtn = view.getByText("Return to sign in");
    fireEvent.press(returnBtn);
    expect(mockPush).toHaveBeenCalledWith("/(auth)/sign-in");
  });
});
