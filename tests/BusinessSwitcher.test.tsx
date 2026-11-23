import { fireEvent, render, waitFor } from "@testing-library/react-native";
import { BusinessSwitcherModal } from "@/features/businesses/components/BusinessSwitcherModal";
import { useBusinessStore } from "@/features/businesses/store";
import { resetRemoteState } from "@/lib/query/client";
import { ThemeProvider } from "@/theme/ThemeProvider";

jest.mock("@/lib/query/client", () => ({
  resetRemoteState: jest.fn().mockResolvedValue(undefined),
}));

describe("Business Switcher & State Isolation", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("switching active business calls resetRemoteState and updates active business", async () => {
    const handleClose = jest.fn();

    const view = render(
      <ThemeProvider>
        <BusinessSwitcherModal visible={true} onClose={handleClose} />
      </ThemeProvider>,
    );

    expect(view.getByText("Active business")).toBeTruthy();
    expect(view.getByText("Acme Services LLC")).toBeTruthy();
    expect(view.getByText("Acme Retail Co")).toBeTruthy();

    // Select Acme Retail Co
    const retailOption = view.getByLabelText("Acme Retail Co, Tap to select");
    fireEvent.press(retailOption);

    await waitFor(() => {
      expect(resetRemoteState).toHaveBeenCalledTimes(1);
      expect(handleClose).toHaveBeenCalledTimes(1);
      expect(useBusinessStore.getState().activeBusinessId).toBe("biz-2");
      expect(useBusinessStore.getState().activeBusiness().name).toBe(
        "Acme Retail Co",
      );
    });
  });
});
