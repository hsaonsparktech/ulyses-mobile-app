import { ledgerAdapter } from "@/features/accountant/api/ledgerAdapter";
import { clientAdapter } from "@/features/clients/api/clientAdapter";
import { documentAdapter } from "@/features/documents/api/documentAdapter";
import { expenseAdapter } from "@/features/employee/api/expenseAdapter";
import { estimateAdapter } from "@/features/estimates/api/estimateAdapter";
import { invoiceAdapter } from "@/features/invoices/api/invoiceAdapter";
import { scanAdapter } from "@/features/scanning/api/scanAdapter";

describe("Sprint 10 — Mobile Typed API Adapters & Boundary Validation", () => {
  const originalFetch = globalThis.fetch;
  const originalEnv = process.env.EXPO_PUBLIC_API_BASE_URL;

  beforeEach(() => {
    process.env.EXPO_PUBLIC_API_BASE_URL = "https://api.libros.test";
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    process.env.EXPO_PUBLIC_API_BASE_URL = originalEnv;
  });

  it("clientAdapter.list injects tenant header and returns client profiles", async () => {
    const mockClients = [
      {
        id: "cli_123",
        businessId: "biz_test_01",
        name: "Acme Corp",
        status: "active",
        totalInvoicedCents: 50000,
        outstandingBalanceCents: 10000,
      },
    ];

    globalThis.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => mockClients,
    } as Response);

    const result = await clientAdapter.list("biz_test_01");

    expect(globalThis.fetch).toHaveBeenCalledWith(
      "https://api.libros.test/api/v1/clients",
      expect.objectContaining({
        method: "GET",
        headers: expect.objectContaining({
          "X-Business-Id": "biz_test_01",
          Accept: "application/json",
        }),
      }),
    );
    expect(result).toEqual(mockClients);
  });

  it("invoiceAdapter.create passes idempotency key and integer cents payload", async () => {
    const mockInvoice = {
      id: "inv_123",
      businessId: "biz_test_01",
      invoiceNumber: "INV-0001",
      status: "draft",
      totalCents: 275000,
    };

    globalThis.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 201,
      json: async () => mockInvoice,
    } as Response);

    const result = await invoiceAdapter.create("biz_test_01", {
      clientId: "cli_123",
      issueDate: "2026-11-01",
      dueDate: "2026-11-15",
      items: [
        { description: "Consulting", quantity: 1, unitPriceCents: 250000 },
      ],
      taxRateBps: 1000,
      idempotencyKey: "idemp_test_99",
    });

    expect(globalThis.fetch).toHaveBeenCalledWith(
      "https://api.libros.test/api/v1/invoices",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          "X-Business-Id": "biz_test_01",
          "Idempotency-Key": "idemp_test_99",
          "Content-Type": "application/json",
        }),
      }),
    );
    expect(result).toEqual(mockInvoice);
  });

  it("estimateAdapter.convert posts to convert endpoint and returns converted invoice", async () => {
    const mockConvertedInvoice = {
      id: "inv_from_est_123",
      status: "draft",
      totalCents: 100000,
    };

    globalThis.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => mockConvertedInvoice,
    } as Response);

    const result = await estimateAdapter.convert("est_123", "biz_test_01");

    expect(globalThis.fetch).toHaveBeenCalledWith(
      "https://api.libros.test/api/v1/estimates/est_123/convert",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          "X-Business-Id": "biz_test_01",
        }),
      }),
    );
    expect(result).toEqual(mockConvertedInvoice);
  });

  it("expenseAdapter.create submits pending employee expense", async () => {
    const mockExpense = {
      id: "exp_123",
      merchant: "Delta Airlines",
      amountCents: 45000,
      status: "pending",
    };

    globalThis.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 201,
      json: async () => mockExpense,
    } as Response);

    const result = await expenseAdapter.create("biz_test_01", {
      category: "Travel",
      merchant: "Delta Airlines",
      amountCents: 45000,
      date: "2026-11-05",
    });

    expect(globalThis.fetch).toHaveBeenCalledWith(
      "https://api.libros.test/api/v1/expenses",
      expect.objectContaining({
        method: "POST",
      }),
    );
    expect(result).toEqual(mockExpense);
  });

  it("ledgerAdapter.listAccounts returns chart of accounts with computed balances", async () => {
    const mockAccounts = [
      {
        id: "acc_1000",
        code: "1000",
        name: "Operating Bank Account",
        type: "asset",
        balanceCents: 500000,
      },
      {
        id: "acc_3000",
        code: "3000",
        name: "Owner Equity",
        type: "equity",
        balanceCents: 500000,
      },
    ];

    globalThis.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => mockAccounts,
    } as Response);

    const result = await ledgerAdapter.listAccounts("biz_test_01");

    expect(globalThis.fetch).toHaveBeenCalledWith(
      "https://api.libros.test/api/v1/ledger/accounts",
      expect.objectContaining({
        method: "GET",
        headers: expect.objectContaining({
          "X-Business-Id": "biz_test_01",
        }),
      }),
    );
    expect(result).toEqual(mockAccounts);
  });

  it("ApiError captures RFC 7807 problem details when server rejects request", async () => {
    const problemDetails = {
      type: "https://api.libros.io/errors/access-denied",
      title: "Access Denied",
      status: 403,
      detail: "Only business owners are authorized to create invoices.",
    };

    globalThis.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 403,
      statusText: "Forbidden",
      json: async () => problemDetails,
    } as Response);

    await expect(
      invoiceAdapter.create("biz_test_01", {
        clientId: "cli_123",
        issueDate: "2026-11-01",
        dueDate: "2026-11-15",
        items: [{ description: "Work", quantity: 1, unitPriceCents: 10000 }],
      }),
    ).rejects.toThrow(
      "Only business owners are authorized to create invoices.",
    );
  });

  it("documentAdapter.create uploads document with folder and status", async () => {
    const mockDoc = {
      id: "doc_receipt_101",
      businessId: "biz_test_01",
      filename: "uber_ride.pdf",
      fileType: "pdf",
      fileSizeBytes: 42000,
      folder: "Receipts",
      status: "Ready",
      isArchived: false,
    };

    globalThis.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 201,
      json: async () => mockDoc,
    } as Response);

    const result = await documentAdapter.create(
      {
        filename: "uber_ride.pdf",
        fileSizeBytes: 42000,
        mimeType: "application/pdf",
        folder: "Receipts",
      },
      "biz_test_01",
    );

    expect(globalThis.fetch).toHaveBeenCalledWith(
      "https://api.libros.test/api/v1/documents",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          "X-Business-Id": "biz_test_01",
        }),
      }),
    );
    expect(result).toEqual(mockDoc);
  });

  it("scanAdapter.processOcr sends scan request and returns provisional extraction", async () => {
    const mockOcrResult = {
      id: "ocr_res_101",
      documentId: "doc_receipt_101",
      vendor: "Uber Technologies",
      totalCents: 3450,
      confidenceScore: 0.96,
      provisional: true,
      status: "pending_review",
    };

    globalThis.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => mockOcrResult,
    } as Response);

    const result = await scanAdapter.processOcr(
      {
        documentId: "doc_receipt_101",
        vendor: "Uber Technologies",
        totalCents: 3450,
      },
      "biz_test_01",
    );

    expect(globalThis.fetch).toHaveBeenCalledWith(
      "https://api.libros.test/api/v1/scanning/ocr",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          "X-Business-Id": "biz_test_01",
        }),
      }),
    );
    expect(result.provisional).toBe(true);
    expect(result.status).toBe("pending_review");
  });
});
