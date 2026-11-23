import { fireEvent, render } from "@testing-library/react-native";
import {
  EmptyState,
  ErrorState,
  LoadingState,
} from "@/components/feedback/Feedback";
import { ThemeProvider } from "@/theme/ThemeProvider";

describe("Feedback states", () => {
  test("LoadingState renders processing feedback message and indicator", () => {
    const view = render(
      <ThemeProvider>
        <LoadingState message="Processing request..." />
      </ThemeProvider>,
    );
    expect(view.getByText("Processing request...")).toBeTruthy();
    expect(view.getByText("This will take a moment")).toBeTruthy();
    expect(view.getByLabelText("Loading session")).toBeTruthy();
  });

  test("ErrorState renders warning feedback and triggers retry callback", () => {
    const onRetry = jest.fn();
    const view = render(
      <ThemeProvider>
        <ErrorState
          title="Payment failed"
          message="Unable to process credit card."
          onRetry={onRetry}
        />
      </ThemeProvider>,
    );
    expect(view.getByText("Payment failed")).toBeTruthy();
    expect(view.getByText("Unable to process credit card.")).toBeTruthy();
    fireEvent.press(view.getByRole("button"));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  test("EmptyState renders empty icon and action trigger", () => {
    const onAction = jest.fn();
    const view = render(
      <ThemeProvider>
        <EmptyState
          title="No transactions"
          message="Add your first income or expense."
          actionTitle="Add expense"
          onAction={onAction}
        />
      </ThemeProvider>,
    );
    expect(view.getByText("No transactions")).toBeTruthy();
    expect(view.getByText("Add your first income or expense.")).toBeTruthy();
    expect(view.getByText("Add expense")).toBeTruthy();
    fireEvent.press(view.getByRole("button"));
    expect(onAction).toHaveBeenCalledTimes(1);
  });
});
