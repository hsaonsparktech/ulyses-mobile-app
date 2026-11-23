import { render, screen } from "@testing-library/react-native";
import { ScanFailedModal } from "@/features/scanning/components/ScanFailedModal";
import { ScanProcessingModal } from "@/features/scanning/components/ScanProcessingModal";
import { ScanReviewModal } from "@/features/scanning/components/ScanReviewModal";
import { ScanSourceModal } from "@/features/scanning/components/ScanSourceModal";
import { useScanStore } from "@/features/scanning/store";

describe("Smart Scanning Flow (Figma 81:809, 243:975, 36:781, 81:1386)", () => {
  it("renders scan source options when open", () => {
    useScanStore.setState({ scanModalOpen: true });
    render(<ScanSourceModal />);

    expect(screen.getByText("Smart Scan")).toBeTruthy();
    expect(screen.getByLabelText("Take photo with camera")).toBeTruthy();
    expect(screen.getByLabelText("Choose from photo library")).toBeTruthy();
    expect(screen.getByLabelText("Browse PDF statement")).toBeTruthy();
  });

  it("renders OCR processing modal when isProcessing is true", () => {
    useScanStore.setState({ isProcessing: true });
    render(<ScanProcessingModal />);

    expect(screen.getByText("Libros AI Smart Scan")).toBeTruthy();
    expect(screen.getByText(/Processing document with edge OCR/)).toBeTruthy();
  });

  it("renders scan review with extraction fields", () => {
    useScanStore.setState({
      reviewModalOpen: true,
      currentScan: {
        id: "test-scan-1",
        sourceType: "camera",
        fileName: "Test_Receipt.jpg",
        status: "review",
        documentType: "receipt",
        vendor: "Test Vendor",
        date: "2026-11-04",
        category: "Office Supplies",
        subtotal: 100,
        tax: 9,
        total: 109,
        confidence: 98,
      },
    });
    render(<ScanReviewModal />);

    expect(screen.getByText("Review Extracted Scan")).toBeTruthy();
    expect(screen.getByDisplayValue("Test Vendor")).toBeTruthy();
    expect(screen.getByText("Confirm & Save to Records")).toBeTruthy();
  });

  it("renders failed scan recovery state", () => {
    useScanStore.setState({
      failedModalOpen: true,
      currentScan: {
        id: "test-fail-1",
        sourceType: "camera",
        fileName: "Blur.jpg",
        status: "failed",
        documentType: "receipt",
        vendor: "",
        date: "",
        category: "",
        subtotal: 0,
        tax: 0,
        total: 0,
        confidence: 10,
        errorMessage: "Unable to read text clearly.",
      },
    });
    render(<ScanFailedModal />);

    expect(screen.getByText("Scan Unsuccessful")).toBeTruthy();
    expect(screen.getByText("Try Again")).toBeTruthy();
  });
});
