import { fireEvent, render } from "@testing-library/react-native";
import { InvoicesScreen } from "@/features/invoices/screens/InvoicesScreen";
import { ThemeProvider } from "@/theme/ThemeProvider";

describe("InvoicesScreen (Figma 36:570, 36:626, 36:733, 81:630, 46:760)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("renders Invoices header, KPIs, filter tabs, invoice items, and modals", () => {
    const view = render(
      <ThemeProvider>
        <InvoicesScreen />
      </ThemeProvider>,
    );

    // Title & business subtitle
    expect(view.getByText("Invoices")).toBeTruthy();
    expect(view.getByText("OUTSTANDING")).toBeTruthy();
    expect(view.getByText("PAID THIS MONTH")).toBeTruthy();
    expect(view.getByText("$2,100")).toBeTruthy();
    expect(view.getByText("$2,450")).toBeTruthy();

    // Filter tabs
    const allTab = view.getByLabelText("Filter invoices: All");
    const unpaidTab = view.getByLabelText("Filter invoices: Unpaid");
    const paidTab = view.getByLabelText("Filter invoices: Paid");
    const overdueTab = view.getByLabelText("Filter invoices: Overdue");

    expect(allTab).toBeTruthy();
    expect(unpaidTab).toBeTruthy();
    expect(paidTab).toBeTruthy();
    expect(overdueTab).toBeTruthy();

    // Verify initial invoice list items
    expect(view.getByText(/INV-0241/)).toBeTruthy();
    expect(view.getByText(/INV-0239/)).toBeTruthy();
    expect(view.getByText(/INV-0232/)).toBeTruthy();

    // Filter by Unpaid
    fireEvent.press(unpaidTab);
    expect(view.getByText(/INV-0241/)).toBeTruthy();
    expect(view.queryByText(/INV-0239/)).toBeNull();

    // Filter by Paid
    fireEvent.press(paidTab);
    expect(view.getByText(/INV-0239/)).toBeTruthy();
    expect(view.queryByText(/INV-0241/)).toBeNull();

    // Filter by Overdue
    fireEvent.press(overdueTab);
    expect(view.getByText(/INV-0232/)).toBeTruthy();
    expect(view.queryByText(/INV-0239/)).toBeNull();

    // Reset to All
    fireEvent.press(allTab);
    expect(view.getByText(/INV-0241/)).toBeTruthy();

    // Secondary action cards: Estimates and Clients
    const estimatesAction = view.getByLabelText("Open Estimates management");
    expect(estimatesAction).toBeTruthy();
    fireEvent.press(estimatesAction);
    expect(view.getByText("Estimates")).toBeTruthy();
    expect(view.getByText("Drafts and customer quotations")).toBeTruthy();

    // Close Estimates modal
    fireEvent.press(view.getByText("Back to invoices"));

    // Open Clients modal
    const clientsAction = view.getByLabelText("Open Clients directory");
    expect(clientsAction).toBeTruthy();
    fireEvent.press(clientsAction);
    expect(view.getByText("Contacts and invoice history")).toBeTruthy();
    expect(view.getByText("CLIENT SUMMARY")).toBeTruthy();

    // Close Clients modal
    fireEvent.press(view.getByLabelText("Close clients directory"));

    // Open Create invoice modal
    const createInvoiceBtn = view.getByText("Create invoice");
    expect(createInvoiceBtn).toBeTruthy();
    fireEvent.press(createInvoiceBtn);
    expect(view.getByText("BILL TO")).toBeTruthy();
    expect(view.getByText("LINE ITEMS")).toBeTruthy();
  });

  test("opens invoice details modal on invoice card tap", () => {
    const view = render(
      <ThemeProvider>
        <InvoicesScreen />
      </ThemeProvider>,
    );

    const invoiceCard = view.getByText(/INV-0241 · Riverbend/);
    fireEvent.press(invoiceCard);

    // Detail modal content
    expect(view.getByText("Invoice INV-0241")).toBeTruthy();
    expect(view.getByText("INVOICE TOTAL")).toBeTruthy();
    expect(view.getByText("Brand identity consultation")).toBeTruthy();
    expect(view.getByText("No online payment collection")).toBeTruthy();
  });
});
