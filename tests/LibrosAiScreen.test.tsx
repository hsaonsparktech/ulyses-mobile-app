import { render, screen } from "@testing-library/react-native";
import { LibrosAiScreen } from "@/features/ai/screens/LibrosAiScreen";

describe("LibrosAiScreen (Figma 36:938)", () => {
  it("renders AI chat co-pilot with suggestions and disclaimer", () => {
    render(<LibrosAiScreen />);

    expect(screen.getByText("Libros AI")).toBeTruthy();
    expect(screen.getByText(/Financial Co-pilot/)).toBeTruthy();
    expect(screen.getByText("Online")).toBeTruthy();

    // Suggestion chips
    expect(screen.getByText("Top vendor expenses this month")).toBeTruthy();

    // Mandatory disclaimer
    expect(
      screen.getAllByText(
        /AI assisted. Always reviewed. Libros AI calculations are preliminary/,
      ).length,
    ).toBeGreaterThan(0);

    // Input bar
    expect(
      screen.getByPlaceholderText(
        "Ask Libros AI about invoices, taxes, expenses...",
      ),
    ).toBeTruthy();
  });
});
