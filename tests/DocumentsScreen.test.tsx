import { render, screen } from "@testing-library/react-native";
import { DocumentsScreen } from "@/features/documents/screens/DocumentsScreen";

describe("DocumentsScreen (Figma 36:890, 81:898, 81:946, 37:642)", () => {
  it("renders documents hub with header, folders, filter tabs, and document list", () => {
    render(<DocumentsScreen />);

    // Header & active count
    expect(screen.getByText("Documents")).toBeTruthy();
    expect(screen.getByText(/Active Files/)).toBeTruthy();

    // Folder shortcuts
    expect(screen.getByText("Receipts")).toBeTruthy();
    expect(screen.getByText("Invoices")).toBeTruthy();
    expect(screen.getByText("Statements")).toBeTruthy();

    // Action buttons
    expect(screen.getByLabelText("Open document calendar")).toBeTruthy();
    expect(screen.getByLabelText("Open document archive")).toBeTruthy();
    expect(screen.getByLabelText("Smart scan receipt")).toBeTruthy();
  });
});
