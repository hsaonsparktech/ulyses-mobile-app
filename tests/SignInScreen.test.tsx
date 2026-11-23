import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, waitFor } from "@testing-library/react-native";
import { SignInScreen } from "@/features/auth/screens/SignInScreen";
import { ThemeProvider } from "@/theme/ThemeProvider";

const mockPush = jest.fn();

jest.mock("expo-router", () => ({
  useRouter: () => ({
    push: mockPush,
    replace: jest.fn(),
  }),
  Redirect: () => null,
}));

const mockSignIn = jest.fn();
jest.mock("@/providers/SessionProvider", () => ({
  useSession: () => ({
    session: null,
    loading: false,
    error: null,
    signIn: mockSignIn,
  }),
}));

describe("SignInScreen (Figma 36:1050 / 59:14 / 59:92)", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    jest.clearAllMocks();
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
  });

  test("renders unboxed form fields, forgot password, continue button, and invite card", () => {
    const view = render(
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <SignInScreen />
        </ThemeProvider>
      </QueryClientProvider>,
    );

    expect(view.getByText("Libros")).toBeTruthy();
    expect(view.getByText("Sign in")).toBeTruthy();
    expect(
      view.getByText("Enter your Libros account credentials."),
    ).toBeTruthy();

    const emailInput = view.getByLabelText("Email address");
    const passwordInput = view.getByLabelText("Password");
    expect(emailInput).toBeTruthy();
    expect(passwordInput).toBeTruthy();

    // Forgot password link
    const forgotLink = view.getByLabelText("Forgot password?");
    fireEvent.press(forgotLink);
    expect(mockPush).toHaveBeenCalledWith("/(auth)/forgot-password");

    // Invite code card link
    const inviteLink = view.getByLabelText("Redeem a valid team access code");
    fireEvent.press(inviteLink);
    expect(mockPush).toHaveBeenCalledWith("/(auth)/invite-code");

    // Continue securely button
    expect(view.getByText("Continue securely")).toBeTruthy();
  });

  test("submits valid credentials to signIn", async () => {
    mockSignIn.mockResolvedValueOnce(undefined);

    const view = render(
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <SignInScreen />
        </ThemeProvider>
      </QueryClientProvider>,
    );

    const emailInput = view.getByLabelText("Email address");
    const passwordInput = view.getByLabelText("Password");

    fireEvent.changeText(emailInput, "test@example.invalid");
    fireEvent.changeText(passwordInput, "correct-password");

    const continueBtn = view.getByText("Continue securely");
    fireEvent.press(continueBtn);

    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalledWith({
        email: "test@example.invalid",
        password: "correct-password",
      });
    });
  });
});
