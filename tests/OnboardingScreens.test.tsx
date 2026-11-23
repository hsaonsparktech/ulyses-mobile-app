import { fireEvent, render, waitFor } from "@testing-library/react-native";
import { BusinessSetupScreen } from "@/features/onboarding/screens/BusinessSetupScreen";
import { RegisterScreen } from "@/features/onboarding/screens/RegisterScreen";
import { VerifyEmailScreen } from "@/features/onboarding/screens/VerifyEmailScreen";
import { ThemeProvider } from "@/theme/ThemeProvider";

const mockPush = jest.fn();
const mockReplace = jest.fn();

jest.mock("expo-router", () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
  }),
  useLocalSearchParams: () => ({ email: "owner@company.com" }),
}));

describe("Onboarding Screens (Figma 36:423, 36:449, 36:477)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("RegisterScreen (36:423)", () => {
    test("validates fields, checks terms, and pushes to verify-email", async () => {
      const view = render(
        <ThemeProvider>
          <RegisterScreen />
        </ThemeProvider>,
      );

      expect(view.getByText("Create your account")).toBeTruthy();
      expect(
        view.getByText("Start with your details, then set up a business."),
      ).toBeTruthy();

      const nameInput = view.getByLabelText("Full name");
      const emailInput = view.getByLabelText("Work email");
      const passwordInput = view.getByLabelText("Password");
      const termsCheckbox = view.getByLabelText(
        "I agree to the Terms and Privacy Policy",
      );

      fireEvent.changeText(nameInput, "Owner Name");
      fireEvent.changeText(emailInput, "owner@company.com");
      fireEvent.changeText(passwordInput, "strongpassword123");
      fireEvent.press(termsCheckbox);

      const submitBtn = view.getByText("Create account");
      fireEvent.press(submitBtn);

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith({
          pathname: "/(auth)/verify-email",
          params: { email: "owner@company.com" },
        });
      });
    });

    test("shows validation errors when submitted empty", async () => {
      const view = render(
        <ThemeProvider>
          <RegisterScreen />
        </ThemeProvider>,
      );

      const submitBtn = view.getByText("Create account");
      fireEvent.press(submitBtn);

      await waitFor(() => {
        expect(
          view.getByText("Full name must be at least 2 characters."),
        ).toBeTruthy();
      });
    });
  });

  describe("VerifyEmailScreen (36:449)", () => {
    test("renders 6-digit cells, resend action, and submits code", async () => {
      const view = render(
        <ThemeProvider>
          <VerifyEmailScreen />
        </ThemeProvider>,
      );

      expect(view.getByText("Verify your email")).toBeTruthy();
      expect(
        view.getByText("Enter the six-digit code sent to owner@company.com."),
      ).toBeTruthy();
      expect(view.getByText("Check your spam folder")).toBeTruthy();

      // Test resend code action
      const resendBtn = view.getByLabelText("Resend code");
      fireEvent.press(resendBtn);
      expect(
        view.getByText("New verification code sent to your email."),
      ).toBeTruthy();

      // Enter 6 digit code
      const hiddenInput = view.getByLabelText("6-digit verification code");
      fireEvent.changeText(hiddenInput, "123456");

      const verifyBtn = view.getByText("Verify email");
      fireEvent.press(verifyBtn);

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith("/(auth)/business-setup");
      });
    });
  });

  describe("BusinessSetupScreen (36:477)", () => {
    test("populates defaults and submits to owner workspace", async () => {
      const view = render(
        <ThemeProvider>
          <BusinessSetupScreen />
        </ThemeProvider>,
      );

      expect(view.getByText("Set up a business")).toBeTruthy();
      expect(
        view.getByText("Add your first company to begin tracking."),
      ).toBeTruthy();
      expect(view.getByText("Multiple businesses supported")).toBeTruthy();

      const nameInput = view.getByLabelText("Business name");
      fireEvent.changeText(nameInput, "Acme Services LLC");

      const submitBtn = view.getByText("Create business");
      fireEvent.press(submitBtn);

      await waitFor(() => {
        expect(mockReplace).toHaveBeenCalledWith("/owner");
      });
    });
  });
});
