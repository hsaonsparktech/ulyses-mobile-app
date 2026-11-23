import { fireEvent, render } from "@testing-library/react-native";
import { EstimatesModal } from "@/features/estimates/components/EstimatesModal";
import { estimateSchema } from "@/features/estimates/schemas/estimate";
import { useEstimateStore } from "@/features/estimates/store";
import { useInvoiceStore } from "@/features/invoices/store";
import { ThemeProvider } from "@/theme/ThemeProvider";

describe("Estimates Module (Figma 94:519, 37:743, 81:718, 86:502, 81:765)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("validates estimateSchema", () => {
    const valid = estimateSchema.safeParse({
      name: "Q4 Marketing Consultation",
      clientId: "client-1",
      clientName: "Riverbend Creative LLC",
      clientEmail: "accounts@riverbend.co",
      items: [
        {
          description: "Strategy session",
          quantity: 2,
          unitPrice: 250,
        },
      ],
      currency: "USD",
    });
    expect(valid.success).toBe(true);

    const invalid = estimateSchema.safeParse({
      name: "",
      clientId: "",
      clientName: "",
      clientEmail: "bad",
      items: [],
    });
    expect(invalid.success).toBe(false);
  });

  test("renders estimates list, filters by status, and opens preview", () => {
    const handleClose = jest.fn();
    const view = render(
      <ThemeProvider>
        <EstimatesModal
          visible={true}
          businessId="biz-1"
          businessName="Acme Services LLC"
          onClose={handleClose}
        />
      </ThemeProvider>,
    );

    expect(view.getByText("Estimates")).toBeTruthy();
    expect(view.getByText("Drafts and customer quotations")).toBeTruthy();
    expect(view.getByText(/EST-0108 · Riverbend/)).toBeTruthy();
    expect(view.getByText(/EST-0104 · Jackson/)).toBeTruthy();

    // Filter by Sent
    const sentFilter = view.getByLabelText("Filter by Sent");
    fireEvent.press(sentFilter);
    expect(view.getByText(/EST-0104 · Jackson/)).toBeTruthy();
    expect(view.queryByText(/EST-0108 · Riverbend/)).toBeNull();

    // Reset to All
    const allFilter = view.getByLabelText("Filter by All");
    fireEvent.press(allFilter);
    expect(view.getByText(/EST-0108 · Riverbend/)).toBeTruthy();

    // Open preview
    const estRow = view.getByText(/EST-0108 · Riverbend/);
    fireEvent.press(estRow);

    expect(view.getByText("Estimate preview")).toBeTruthy();
    expect(view.getByText("EST-0108")).toBeTruthy();
    expect(view.getByText("Bill to: Riverbend Creative LLC")).toBeTruthy();
    expect(view.getByText("TOTAL USD")).toBeTruthy();
    expect(view.getByText("$1350.00")).toBeTruthy();
  });

  test("converts estimate into invoice draft in store", () => {
    const { estimates, markConverted } = useEstimateStore.getState();
    const { addInvoice, invoices } = useInvoiceStore.getState();

    const targetEst = estimates[0];
    if (!targetEst) throw new Error("targetEst expected");
    expect(targetEst).toBeDefined();

    const initialInvoiceCount = invoices.length;
    const newInvoice = addInvoice(targetEst.businessId, {
      clientId: targetEst.clientId,
      clientName: targetEst.clientName,
      clientEmail: targetEst.clientEmail,
      issueDate: "Nov 08, 2026",
      dueDate: "Nov 22, 2026",
      currency: targetEst.currency,
      items: targetEst.items.map((it) => ({
        description: it.description,
        quantity: it.quantity,
        unitPrice: it.unitPrice,
      })),
      tax: targetEst.tax,
      status: "Draft",
    });

    markConverted(targetEst.id, newInvoice.id);

    const updatedInvoices = useInvoiceStore.getState().invoices;
    expect(updatedInvoices.length).toBe(initialInvoiceCount + 1);
    const firstInvoice = updatedInvoices[0];
    if (!firstInvoice) throw new Error("firstInvoice expected");
    expect(firstInvoice.clientName).toBe(targetEst.clientName);
    expect(firstInvoice.total).toBe(targetEst.total);
  });
});
