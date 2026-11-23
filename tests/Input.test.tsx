import { fireEvent, render } from "@testing-library/react-native";
import { Input } from "@/components/ui/Input";
import { ThemeProvider } from "@/theme/ThemeProvider";

describe("Input component", () => {
  test("renders label and handles text change, focus and blur", () => {
    const onChangeText = jest.fn();
    const onFocus = jest.fn();
    const onBlur = jest.fn();

    const view = render(
      <ThemeProvider>
        <Input
          label="Email address"
          placeholder="Enter your email"
          onChangeText={onChangeText}
          onFocus={onFocus}
          onBlur={onBlur}
        />
      </ThemeProvider>,
    );

    const input = view.getByLabelText("Email address");
    expect(input).toBeTruthy();

    fireEvent.changeText(input, "owner@example.com");
    expect(onChangeText).toHaveBeenCalledWith("owner@example.com");

    fireEvent(input, "focus");
    expect(onFocus).toHaveBeenCalled();

    fireEvent(input, "blur");
    expect(onBlur).toHaveBeenCalled();
  });

  test("renders error message and marks accessibility invalid", () => {
    const view = render(
      <ThemeProvider>
        <Input
          label="Password"
          error="Password must be at least 8 characters."
        />
      </ThemeProvider>,
    );

    expect(
      view.getByText("Password must be at least 8 characters."),
    ).toBeTruthy();
    expect(view.getByLabelText("Password").props["aria-invalid"]).toBe(true);
  });
});
