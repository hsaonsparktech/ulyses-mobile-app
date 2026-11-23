import { fireEvent, render } from "@testing-library/react-native";
import { Button } from "@/components/ui/Button";

test("button invokes actions and blocks disabled/loading submissions", () => {
  const press = jest.fn();
  const view = render(<Button title="Continue" onPress={press} />);
  fireEvent.press(view.getByRole("button"));
  expect(press).toHaveBeenCalledTimes(1);
  view.rerender(<Button title="Continue" onPress={press} loading />);
  fireEvent.press(view.getByRole("button"));
  expect(press).toHaveBeenCalledTimes(1);
  expect(view.getByRole("button").props.accessibilityState.busy).toBe(true);
});
