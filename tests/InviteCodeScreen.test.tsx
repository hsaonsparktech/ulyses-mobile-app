import { fireEvent, render, waitFor } from "@testing-library/react-native";
import { InviteCodeScreen } from "@/features/auth/screens/InviteCodeScreen";
import { ThemeProvider } from "@/theme/ThemeProvider";

const mockPush = jest.fn();
const mockReplace = jest.fn();

jest.mock("expo-router", () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
  }),
}));

describe("InviteCodeScreen (Figma 55:13, 41:7, 59:57)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("validates code and transitions to accepted state (41:7)", async () => {
    const view = render(
      <ThemeProvider>
        <InviteCodeScreen />
      </ThemeProvider>,
    );

    expect(view.getByText("Join a business")).toBeTruthy();
    expect(
      view.getByText("Use the access code supplied by its owner."),
    ).toBeTruthy();
    expect(view.getByText("AFTER YOUR INVITE IS VERIFIED")).toBeTruthy();

    const codeInput = view.getByLabelText("Access code");
    fireEvent.changeText(codeInput, "TEAM-2026");

    const submitBtn = view.getByText("Verify invitation");
    fireEvent.press(submitBtn);

    await waitFor(() => {
      expect(view.getByText("You're invited")).toBeTruthy();
      expect(view.getByText("WELCOME TO THE TEAM")).toBeTruthy();
      expect(view.getByText("Role: employee")).toBeTruthy();
      expect(view.getByText("Open assigned workspace")).toBeTruthy();
    });

    const openBtn = view.getByText("Open assigned workspace");
    fireEvent.press(openBtn);
    expect(mockReplace).toHaveBeenCalledWith("/employee");
  });

  test("handles unavailable/invalid code state (59:57) and allows retry", async () => {
    const view = render(
      <ThemeProvider>
        <InviteCodeScreen />
      </ThemeProvider>,
    );

    const codeInput = view.getByLabelText("Access code");
    fireEvent.changeText(codeInput, "EXPIRED");

    const submitBtn = view.getByText("Verify invitation");
    fireEvent.press(submitBtn);

    await waitFor(() => {
      expect(view.getByText("Access unavailable")).toBeTruthy();
      expect(view.getByText("INVITATION NOT VALID")).toBeTruthy();
      expect(view.getByText("Return to sign in")).toBeTruthy();
      expect(view.getByText("Try another code")).toBeTruthy();
    });

    const retryBtn = view.getByText("Try another code");
    fireEvent.press(retryBtn);

    // Should return back to entry form
    await waitFor(() => {
      expect(view.getByText("Join a business")).toBeTruthy();
    });
  });
});
