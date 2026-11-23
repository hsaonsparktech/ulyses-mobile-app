import type { IncomingMessage, ServerResponse } from "node:http";
import type { Database } from "./db/client";
import { getDatabase } from "./db/client";
import type { RequestWithAuth } from "./middleware/auth";
import { createAuthMiddleware } from "./middleware/auth";
import { corsMiddleware } from "./middleware/cors";
import { handleRequestError } from "./middleware/errorHandler";
import { createRateLimiter } from "./middleware/rateLimiter";
import { createTenancyMiddleware } from "./middleware/tenancy";
import { createAuthRoutes } from "./routes/auth";
import { createBusinessRoutes } from "./routes/businesses";
import { createClientRoutes } from "./routes/clients";
import { createDocumentRoutes } from "./routes/documents";
import { createEstimateRoutes } from "./routes/estimates";
import { createExpenseRoutes } from "./routes/expenses";
import { createHealthRoutes } from "./routes/health";
import { createInvoiceRoutes } from "./routes/invoices";
import { createLedgerRoutes } from "./routes/ledger";
import { createScanningRoutes } from "./routes/scanning";
import { createTeamRoutes } from "./routes/team";
import { HttpError } from "./utils/problemDetails";

async function parseJsonBody(req: IncomingMessage): Promise<unknown> {
  return new Promise((resolve, reject) => {
    let raw = "";
    req.on("data", (chunk) => {
      raw += chunk;
      // Cap at 1MB to prevent memory exhaustion
      if (raw.length > 1024 * 1024) {
        reject(
          new HttpError(
            413,
            "Payload Too Large",
            "Request body exceeds 1MB limit.",
          ),
        );
      }
    });
    req.on("end", () => {
      if (!raw || raw.trim().length === 0) {
        resolve({});
        return;
      }
      try {
        resolve(JSON.parse(raw));
      } catch {
        reject(
          new HttpError(
            400,
            "Malformed JSON",
            "Request body contains invalid JSON.",
          ),
        );
      }
    });
    req.on("error", reject);
  });
}

export function createApp(db?: Database) {
  const database = db ?? getDatabase();

  const authMiddleware = createAuthMiddleware(database);
  const tenancyMiddleware = createTenancyMiddleware(database);
  const authRateLimiter = createRateLimiter({
    maxRequests: 30,
    windowMs: 60 * 1000,
    keyPrefix: "auth",
  });

  const healthRoutes = createHealthRoutes(database);
  const authRoutes = createAuthRoutes(database);
  const businessRoutes = createBusinessRoutes(database);
  const teamRoutes = createTeamRoutes(database);
  const clientRoutes = createClientRoutes(database);
  const invoiceRoutes = createInvoiceRoutes(database);
  const estimateRoutes = createEstimateRoutes(database);
  const expenseRoutes = createExpenseRoutes(database);
  const ledgerRoutes = createLedgerRoutes(database);
  const documentRoutes = createDocumentRoutes(database);
  const scanningRoutes = createScanningRoutes(database);

  return async (req: IncomingMessage, res: ServerResponse): Promise<void> => {
    const customReq = req as RequestWithAuth;
    const urlObj = new URL(
      req.url || "/",
      `http://${req.headers.host || "localhost"}`,
    );
    const pathname = urlObj.pathname;
    const method = req.method?.toUpperCase() || "GET";

    customReq.query = Object.fromEntries(urlObj.searchParams.entries());

    try {
      // 1. Global CORS
      let corsHandled = false;
      corsMiddleware(req, res, () => {
        corsHandled = true;
      });
      if (!corsHandled) return; // OPTIONS 204 handled

      // 2. Parse JSON body for mutation methods (bypass for streaming binary uploads)
      if (["POST", "PATCH", "PUT"].includes(method)) {
        if (pathname === "/api/v1/documents/upload") {
          // Bypassed for binary document upload stream up to 15MB
        } else {
          customReq.body = await parseJsonBody(req);
        }
      }

      // Helper to chain middleware sequentially
      const runMiddleware = (
        fn: (r: RequestWithAuth, s: ServerResponse, n: () => void) => void,
      ): Promise<void> => {
        return new Promise((resolve) => fn(customReq, res, resolve));
      };

      // 3. Routing Table
      // Health
      if (method === "GET" && pathname === "/api/v1/health") {
        healthRoutes.handleHealth(customReq, res);
        return;
      }

      // Auth (Public)
      if (method === "POST" && pathname === "/api/v1/auth/register") {
        await runMiddleware(authRateLimiter);
        authRoutes.handleRegister(customReq, res);
        return;
      }
      if (method === "POST" && pathname === "/api/v1/auth/verify-email") {
        authRoutes.handleVerifyEmail(customReq, res);
        return;
      }
      if (method === "POST" && pathname === "/api/v1/auth/sign-in") {
        await runMiddleware(authRateLimiter);
        authRoutes.handleSignIn(customReq, res);
        return;
      }
      if (method === "POST" && pathname === "/api/v1/auth/refresh") {
        authRoutes.handleRefresh(customReq, res);
        return;
      }
      if (method === "POST" && pathname === "/api/v1/auth/forgot-password") {
        await runMiddleware(authRateLimiter);
        authRoutes.handleForgotPassword(customReq, res);
        return;
      }
      if (method === "POST" && pathname === "/api/v1/auth/invite/verify") {
        authRoutes.handleVerifyInvite(customReq, res);
        return;
      }

      // Auth (Protected)
      if (method === "POST" && pathname === "/api/v1/auth/invite/accept") {
        await runMiddleware(authMiddleware);
        authRoutes.handleAcceptInvite(customReq, res);
        return;
      }
      if (method === "POST" && pathname === "/api/v1/auth/sign-out") {
        await runMiddleware(authMiddleware);
        authRoutes.handleSignOut(customReq, res);
        return;
      }
      if (method === "GET" && pathname === "/api/v1/auth/me") {
        await runMiddleware(authMiddleware);
        authRoutes.handleGetMe(customReq, res);
        return;
      }

      // Businesses
      if (method === "POST" && pathname === "/api/v1/businesses") {
        await runMiddleware(authMiddleware);
        businessRoutes.handleCreateBusiness(customReq, res);
        return;
      }
      if (method === "GET" && pathname === "/api/v1/businesses/my") {
        await runMiddleware(authMiddleware);
        businessRoutes.handleGetMyBusinesses(customReq, res);
        return;
      }
      if (method === "GET" && pathname === "/api/v1/businesses/current") {
        await runMiddleware(authMiddleware);
        await runMiddleware(tenancyMiddleware);
        businessRoutes.handleGetCurrentBusiness(customReq, res);
        return;
      }
      if (method === "PATCH" && pathname === "/api/v1/businesses/current") {
        await runMiddleware(authMiddleware);
        await runMiddleware(tenancyMiddleware);
        businessRoutes.handleUpdateCurrentBusiness(customReq, res);
        return;
      }

      // Team (Tenant-scoped)
      if (method === "GET" && pathname === "/api/v1/team/members") {
        await runMiddleware(authMiddleware);
        await runMiddleware(tenancyMiddleware);
        teamRoutes.handleListMembers(customReq, res);
        return;
      }
      if (method === "POST" && pathname === "/api/v1/team/invite") {
        await runMiddleware(authMiddleware);
        await runMiddleware(tenancyMiddleware);
        teamRoutes.handleInviteMember(customReq, res);
        return;
      }
      const memberDeleteMatch = pathname.match(
        /^\/api\/v1\/team\/members\/([^/]+)$/,
      );
      if (method === "DELETE" && memberDeleteMatch?.[1]) {
        customReq.params = { id: memberDeleteMatch[1] };
        await runMiddleware(authMiddleware);
        await runMiddleware(tenancyMiddleware);
        teamRoutes.handleRevokeMember(customReq, res);
        return;
      }

      // Clients (Tenant-scoped)
      if (method === "GET" && pathname === "/api/v1/clients") {
        await runMiddleware(authMiddleware);
        await runMiddleware(tenancyMiddleware);
        clientRoutes.handleListClients(customReq, res);
        return;
      }
      if (method === "POST" && pathname === "/api/v1/clients") {
        await runMiddleware(authMiddleware);
        await runMiddleware(tenancyMiddleware);
        clientRoutes.handleCreateClient(customReq, res);
        return;
      }
      const clientMatch = pathname.match(/^\/api\/v1\/clients\/([^/]+)$/);
      if (clientMatch?.[1]) {
        customReq.params = { id: clientMatch[1] };
        await runMiddleware(authMiddleware);
        await runMiddleware(tenancyMiddleware);
        if (method === "GET") {
          clientRoutes.handleGetClient(customReq, res);
          return;
        }
        if (method === "PATCH") {
          clientRoutes.handleUpdateClient(customReq, res);
          return;
        }
        if (method === "DELETE") {
          clientRoutes.handleArchiveClient(customReq, res);
          return;
        }
      }

      // Invoices (Tenant-scoped)
      if (method === "GET" && pathname === "/api/v1/invoices") {
        await runMiddleware(authMiddleware);
        await runMiddleware(tenancyMiddleware);
        invoiceRoutes.handleListInvoices(customReq, res);
        return;
      }
      if (method === "POST" && pathname === "/api/v1/invoices") {
        await runMiddleware(authMiddleware);
        await runMiddleware(tenancyMiddleware);
        await invoiceRoutes.handleCreateInvoice(customReq, res);
        return;
      }
      const invoiceSendMatch = pathname.match(
        /^\/api\/v1\/invoices\/([^/]+)\/send$/,
      );
      if (method === "POST" && invoiceSendMatch?.[1]) {
        customReq.params = { id: invoiceSendMatch[1] };
        await runMiddleware(authMiddleware);
        await runMiddleware(tenancyMiddleware);
        invoiceRoutes.handleSendInvoice(customReq, res);
        return;
      }
      const invoicePaymentMatch = pathname.match(
        /^\/api\/v1\/invoices\/([^/]+)\/payments?$/,
      );
      if (method === "POST" && invoicePaymentMatch?.[1]) {
        customReq.params = { id: invoicePaymentMatch[1] };
        await runMiddleware(authMiddleware);
        await runMiddleware(tenancyMiddleware);
        await invoiceRoutes.handleRecordPayment(customReq, res);
        return;
      }
      const invoiceMatch = pathname.match(/^\/api\/v1\/invoices\/([^/]+)$/);
      if (method === "GET" && invoiceMatch?.[1]) {
        customReq.params = { id: invoiceMatch[1] };
        await runMiddleware(authMiddleware);
        await runMiddleware(tenancyMiddleware);
        invoiceRoutes.handleGetInvoice(customReq, res);
        return;
      }

      // Estimates (Tenant-scoped)
      if (method === "GET" && pathname === "/api/v1/estimates") {
        await runMiddleware(authMiddleware);
        await runMiddleware(tenancyMiddleware);
        estimateRoutes.handleListEstimates(customReq, res);
        return;
      }
      if (method === "POST" && pathname === "/api/v1/estimates") {
        await runMiddleware(authMiddleware);
        await runMiddleware(tenancyMiddleware);
        estimateRoutes.handleCreateEstimate(customReq, res);
        return;
      }
      const estimateConvertMatch = pathname.match(
        /^\/api\/v1\/estimates\/([^/]+)\/convert$/,
      );
      if (method === "POST" && estimateConvertMatch?.[1]) {
        customReq.params = { id: estimateConvertMatch[1] };
        await runMiddleware(authMiddleware);
        await runMiddleware(tenancyMiddleware);
        await estimateRoutes.handleConvertToInvoice(customReq, res);
        return;
      }
      const estimateMatch = pathname.match(/^\/api\/v1\/estimates\/([^/]+)$/);
      if (method === "GET" && estimateMatch?.[1]) {
        customReq.params = { id: estimateMatch[1] };
        await runMiddleware(authMiddleware);
        await runMiddleware(tenancyMiddleware);
        estimateRoutes.handleGetEstimate(customReq, res);
        return;
      }

      // Expenses (Tenant-scoped)
      if (method === "GET" && pathname === "/api/v1/expenses") {
        await runMiddleware(authMiddleware);
        await runMiddleware(tenancyMiddleware);
        expenseRoutes.handleListExpenses(customReq, res);
        return;
      }
      if (method === "POST" && pathname === "/api/v1/expenses") {
        await runMiddleware(authMiddleware);
        await runMiddleware(tenancyMiddleware);
        await expenseRoutes.handleCreateExpense(customReq, res);
        return;
      }
      const expenseApproveMatch = pathname.match(
        /^\/api\/v1\/expenses\/([^/]+)\/approve$/,
      );
      if (method === "POST" && expenseApproveMatch?.[1]) {
        customReq.params = { id: expenseApproveMatch[1] };
        await runMiddleware(authMiddleware);
        await runMiddleware(tenancyMiddleware);
        expenseRoutes.handleApproveExpense(customReq, res);
        return;
      }
      const expenseRejectMatch = pathname.match(
        /^\/api\/v1\/expenses\/([^/]+)\/reject$/,
      );
      if (method === "POST" && expenseRejectMatch?.[1]) {
        customReq.params = { id: expenseRejectMatch[1] };
        await runMiddleware(authMiddleware);
        await runMiddleware(tenancyMiddleware);
        expenseRoutes.handleRejectExpense(customReq, res);
        return;
      }
      const expenseMatch = pathname.match(/^\/api\/v1\/expenses\/([^/]+)$/);
      if (method === "GET" && expenseMatch?.[1]) {
        customReq.params = { id: expenseMatch[1] };
        await runMiddleware(authMiddleware);
        await runMiddleware(tenancyMiddleware);
        expenseRoutes.handleGetExpense(customReq, res);
        return;
      }

      // General Ledger & Chart of Accounts (Tenant-scoped)
      if (
        method === "GET" &&
        (pathname === "/api/v1/accounts" ||
          pathname === "/api/v1/ledger/accounts")
      ) {
        await runMiddleware(authMiddleware);
        await runMiddleware(tenancyMiddleware);
        ledgerRoutes.handleListAccounts(customReq, res);
        return;
      }
      if (method === "GET" && pathname === "/api/v1/ledger/entries") {
        await runMiddleware(authMiddleware);
        await runMiddleware(tenancyMiddleware);
        ledgerRoutes.handleListEntries(customReq, res);
        return;
      }
      if (method === "POST" && pathname === "/api/v1/ledger/entries") {
        await runMiddleware(authMiddleware);
        await runMiddleware(tenancyMiddleware);
        ledgerRoutes.handleCreateEntry(customReq, res);
        return;
      }
      const ledgerReverseMatch = pathname.match(
        /^\/api\/v1\/ledger\/entries\/([^/]+)\/reverse$/,
      );
      if (method === "POST" && ledgerReverseMatch?.[1]) {
        customReq.params = { id: ledgerReverseMatch[1] };
        await runMiddleware(authMiddleware);
        await runMiddleware(tenancyMiddleware);
        ledgerRoutes.handleReverseEntry(customReq, res);
        return;
      }

      // Documents (Tenant-scoped)
      if (method === "GET" && pathname === "/api/v1/documents") {
        await runMiddleware(authMiddleware);
        await runMiddleware(tenancyMiddleware);
        documentRoutes.handleListDocuments(customReq, res);
        return;
      }
      if (method === "POST" && pathname === "/api/v1/documents/upload") {
        await runMiddleware(authMiddleware);
        await runMiddleware(tenancyMiddleware);
        await documentRoutes.handleUploadDocument(customReq, res);
        return;
      }
      if (method === "POST" && pathname === "/api/v1/documents") {
        await runMiddleware(authMiddleware);
        await runMiddleware(tenancyMiddleware);
        documentRoutes.handleCreateDocument(customReq, res);
        return;
      }
      const documentDownloadMatch = pathname.match(
        /^\/api\/v1\/documents\/([^/]+)\/download$/,
      );
      if (method === "GET" && documentDownloadMatch?.[1]) {
        customReq.params = { id: documentDownloadMatch[1] };
        await runMiddleware(authMiddleware);
        await runMiddleware(tenancyMiddleware);
        documentRoutes.handleDownloadDocument(customReq, res);
        return;
      }
      const documentArchiveMatch = pathname.match(
        /^\/api\/v1\/documents\/([^/]+)\/archive$/,
      );
      if (method === "POST" && documentArchiveMatch?.[1]) {
        customReq.params = { id: documentArchiveMatch[1] };
        await runMiddleware(authMiddleware);
        await runMiddleware(tenancyMiddleware);
        documentRoutes.handleArchiveDocument(customReq, res);
        return;
      }
      const documentMatch = pathname.match(/^\/api\/v1\/documents\/([^/]+)$/);
      if (method === "GET" && documentMatch?.[1]) {
        customReq.params = { id: documentMatch[1] };
        await runMiddleware(authMiddleware);
        await runMiddleware(tenancyMiddleware);
        documentRoutes.handleGetDocument(customReq, res);
        return;
      }

      // Scanning & OCR Pipeline (Tenant-scoped, provisional only)
      if (method === "POST" && pathname === "/api/v1/scanning/ocr") {
        await runMiddleware(authMiddleware);
        await runMiddleware(tenancyMiddleware);
        scanningRoutes.handleProcessOcr(customReq, res);
        return;
      }
      const scanningReviewMatch = pathname.match(
        /^\/api\/v1\/scanning\/results\/([^/]+)\/review$/,
      );
      if (method === "POST" && scanningReviewMatch?.[1]) {
        customReq.params = { id: scanningReviewMatch[1] };
        await runMiddleware(authMiddleware);
        await runMiddleware(tenancyMiddleware);
        scanningRoutes.handleReviewOcrResult(customReq, res);
        return;
      }
      const scanningResultMatch = pathname.match(
        /^\/api\/v1\/scanning\/results\/([^/]+)$/,
      );
      if (method === "GET" && scanningResultMatch?.[1]) {
        customReq.params = { id: scanningResultMatch[1] };
        await runMiddleware(authMiddleware);
        await runMiddleware(tenancyMiddleware);
        scanningRoutes.handleGetOcrResult(customReq, res);
        return;
      }

      // Route Not Found -> RFC 7807 404
      throw new HttpError(
        404,
        "Not Found",
        `The endpoint ${method} ${pathname} does not exist on this server.`,
      );
    } catch (err) {
      handleRequestError(err, pathname, res);
    }
  };
}
