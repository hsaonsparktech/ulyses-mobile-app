import { useAccountantStore } from "@/features/accountant/store";
import { useClientStore } from "@/features/clients/store";
import { useDocumentStore } from "@/features/documents/store";
import { useEmployeeStore } from "@/features/employee/store";
import { useEstimateStore } from "@/features/estimates/store";
import { useInvoiceStore } from "@/features/invoices/store";
import { useScanStore } from "@/features/scanning/store";

jest.mock("@/config/env", () => ({
  env: {
    mockAuth: false,
    apiBaseUrl: "https://api.libros.test",
  },
}));

describe("Sprint 10B — Mobile Store & Backend Integration", () => {
  const originalFetch = globalThis.fetch;
  const originalEnv = process.env.EXPO_PUBLIC_API_BASE_URL;

  beforeEach(() => {
    process.env.EXPO_PUBLIC_API_BASE_URL = "https://api.libros.test";
    useClientStore.getState().resetRemoteState();
    useInvoiceStore.getState().resetRemoteState();
    useEstimateStore.getState().resetRemoteState();
    useEmployeeStore.getState().resetRemoteState();
    useDocumentStore.getState().resetRemoteState();
    useScanStore.getState().resetRemoteState();
    useAccountantStore.getState().resetRemoteState();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    process.env.EXPO_PUBLIC_API_BASE_URL = originalEnv;
  });

  it("useClientStore.fetchClients fetches from live API and synchronizes state", async () => {
    const mockClients = [
      {
        id: "cli_remote_01",
        businessId: "biz_test_01",
        name: "Remote Client Inc",
        email: "remote@client.com",
        phone: "555-0199",
        address: "123 Remote Way",
        status: "active",
        totalInvoicedCents: 150000,
        outstandingBalanceCents: 45000,
        createdAt: "2026-11-20T10:00:00Z",
        updatedAt: "2026-11-20T10:00:00Z",
      },
    ];

    globalThis.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => mockClients,
    } as Response);

    const clients = await useClientStore.getState().fetchClients("biz_test_01");

    expect(clients).toHaveLength(1);
    expect(clients[0]!.name).toBe("Remote Client Inc");
    expect(clients[0]!.outstandingAmount).toBe(450); // 45000 cents -> 450 USD
    expect(useClientStore.getState().isLoading).toBe(false);
  });

  it("useInvoiceStore.fetchInvoices fetches from live API and maps cents to dollars", async () => {
    const mockInvoices = [
      {
        id: "inv_remote_01",
        businessId: "biz_test_01",
        clientId: "cli_01",
        clientName: "Client A",
        invoiceNumber: "INV-999",
        issueDate: "2026-11-20",
        dueDate: "2026-12-04",
        status: "sent",
        currency: "USD",
        subtotalCents: 20000,
        taxCents: 1600,
        totalCents: 21600,
        amountPaidCents: 0,
        remainingBalanceCents: 21600,
        notes: null,
        items: [
          {
            id: "item_01",
            description: "Consulting",
            quantity: 2,
            unitPriceCents: 10000,
            totalCents: 20000,
          },
        ],
        createdAt: "2026-11-20T10:00:00Z",
        updatedAt: "2026-11-20T10:00:00Z",
      },
    ];

    globalThis.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => mockInvoices,
    } as Response);

    const invoices = await useInvoiceStore
      .getState()
      .fetchInvoices("biz_test_01");

    expect(invoices).toHaveLength(1);
    expect(invoices[0]!.invoiceNumber).toBe("INV-999");
    expect(invoices[0]!.total).toBe(216); // 21600 cents -> 216 USD
    expect(invoices[0]!.status).toBe("Unpaid"); // 'sent' status maps to 'Unpaid' in UI
  });

  it("useEstimateStore.convertEstimate calls backend and transitions to Accepted", async () => {
    const mockConvertedInvoice = {
      id: "inv_from_est_01",
      businessId: "biz_test_01",
      clientId: "cli_01",
      invoiceNumber: "INV-1001",
      issueDate: "2026-11-21",
      dueDate: "2026-12-05",
      status: "draft",
      currency: "USD",
      subtotalCents: 50000,
      taxCents: 4000,
      totalCents: 54000,
      amountPaidCents: 0,
      remainingBalanceCents: 54000,
      notes: null,
      items: [],
      createdAt: "2026-11-21T10:00:00Z",
      updatedAt: "2026-11-21T10:00:00Z",
    };

    globalThis.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => mockConvertedInvoice,
    } as Response);

    const invoiceId = await useEstimateStore
      .getState()
      .convertEstimate("est_01", "biz_test_01");

    expect(invoiceId).toBe("inv_from_est_01");
  });

  it("useEmployeeStore.fetchExpenses retrieves remote expenses", async () => {
    const mockExpenses = [
      {
        id: "exp_remote_01",
        businessId: "biz_test_01",
        category: "Software",
        merchant: "Figma Subscription",
        amountCents: 4500,
        currency: "USD",
        date: "2026-11-18",
        receiptUrl: null,
        status: "pending",
        createdBy: "usr_emp_01",
        approvedBy: null,
        journalEntryId: null,
        createdAt: "2026-11-18T10:00:00Z",
        updatedAt: "2026-11-18T10:00:00Z",
      },
    ];

    globalThis.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => mockExpenses,
    } as Response);

    const drafts = await useEmployeeStore
      .getState()
      .fetchExpenses("biz_test_01");

    expect(drafts).toHaveLength(1);
    expect(drafts[0]!.vendor).toBe("Figma Subscription");
    expect(drafts[0]!.amount).toBe(45); // 4500 cents -> 45 USD
    expect(drafts[0]!.status).toBe("submitted");
  });

  it("useDocumentStore.fetchDocuments retrieves remote document profiles", async () => {
    const mockDocs = [
      {
        id: "doc_remote_01",
        businessId: "biz_test_01",
        filename: "receipt_nov.pdf",
        fileType: "pdf",
        fileSizeBytes: 20480,
        mimeType: "application/pdf",
        folder: "Receipts",
        storagePath:
          "storage/documents/biz_test_01/doc_remote_01_receipt_nov.pdf",
        status: "Ready",
        uploadedBy: "usr_01",
        isArchived: false,
        createdAt: "2026-11-19T10:00:00Z",
        updatedAt: "2026-11-19T10:00:00Z",
      },
    ];

    globalThis.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => mockDocs,
    } as Response);

    const docs = await useDocumentStore
      .getState()
      .fetchDocuments("biz_test_01");

    expect(docs).toHaveLength(1);
    expect(docs[0]!.filename).toBe("receipt_nov.pdf");
    expect(docs[0]!.fileSize).toBe("20 KB");
    expect(docs[0]!.type).toBe("Receipt");
  });

  it("useScanStore.confirmScan confirms review with scanAdapter", async () => {
    globalThis.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        id: "ocr_01",
        documentId: "doc_01",
        businessId: "biz_test_01",
        status: "confirmed",
        provisional: false,
      }),
    } as Response);

    useScanStore.setState({
      currentScan: {
        id: "doc_01",
        sourceType: "camera",
        fileName: "test.jpg",
        status: "review",
        documentType: "receipt",
        vendor: "Test Vendor",
        date: "2026-11-20",
        category: "Supplies",
        subtotal: 10,
        tax: 1,
        total: 11,
        confidence: 95,
      },
    });

    await useScanStore.getState().confirmScan("biz_test_01", "doc_01");

    expect(useScanStore.getState().currentScan?.status).toBe("confirmed");
    expect(globalThis.fetch).toHaveBeenCalledWith(
      "https://api.libros.test/api/v1/scanning/results/doc_01/review",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ action: "confirmed" }),
      }),
    );
  });

  it("useAccountantStore.fetchLedgerAccounts fetches chart of accounts", async () => {
    const mockAccounts = [
      {
        id: "acc_01",
        businessId: "biz_test_01",
        code: "1000",
        name: "Operating Checking",
        type: "asset",
        currency: "USD",
        status: "active",
        balanceCents: 500000,
        createdAt: "2026-11-01T00:00:00Z",
      },
    ];

    globalThis.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => mockAccounts,
    } as Response);

    const accounts = await useAccountantStore
      .getState()
      .fetchLedgerAccounts("biz_test_01");

    expect(accounts).toHaveLength(1);
    expect(accounts[0]!.code).toBe("1000");
    expect(accounts[0]!.balanceCents).toBe(500000);
  });
});
