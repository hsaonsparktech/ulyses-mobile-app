import { logger } from "../config/logger";
import { hashPassword } from "../utils/crypto";
import { type Database, getDatabase } from "./client";
import { runMigrations } from "./migrate";

export interface SeededData {
  ownerUser: { id: string; email: string; fullName: string };
  employeeUser: { id: string; email: string; fullName: string };
  accountantUser: { id: string; email: string; fullName: string };
  business: { id: string; name: string };
}

export function seedDatabase(db?: Database): SeededData {
  const database = db ?? getDatabase();
  runMigrations(database);

  const ownerPwd = hashPassword("OwnerPassword123!");
  const employeePwd = hashPassword("EmployeePassword123!");
  const accountantPwd = hashPassword("AccountantPassword123!");

  const ownerId = "usr_owner_001";
  const employeeId = "usr_employee_001";
  const accountantId = "usr_accountant_001";
  const businessId = "biz_acme_services_001";

  database.transaction(() => {
    // 1. Users
    const insertUser = database.prepare(`
      INSERT OR REPLACE INTO users (id, email, password_hash, password_salt, full_name, is_verified)
      VALUES (?, ?, ?, ?, ?, 1)
    `);

    insertUser.run(
      ownerId,
      "owner@acmeservices.com",
      ownerPwd.hash,
      ownerPwd.salt,
      "Eleanor Vance",
    );
    insertUser.run(
      employeeId,
      "employee@acmeservices.com",
      employeePwd.hash,
      employeePwd.salt,
      "Marcus Brody",
    );
    insertUser.run(
      accountantId,
      "accountant@cpa-firm.com",
      accountantPwd.hash,
      accountantPwd.salt,
      "Sarah Jenkins, CPA",
    );

    // 2. Business
    database
      .prepare(`
      INSERT OR REPLACE INTO businesses (id, name, business_type, currency, status)
      VALUES (?, 'Acme Services LLC', 'Service / Consulting', 'USD', 'active')
    `)
      .run(businessId);

    // 3. Memberships
    const insertMembership = database.prepare(`
      INSERT OR REPLACE INTO memberships (id, user_id, business_id, role, status, permissions)
      VALUES (?, ?, ?, ?, 'active', ?)
    `);

    insertMembership.run(
      "mem_owner_001",
      ownerId,
      businessId,
      "owner",
      JSON.stringify(["all"]),
    );
    insertMembership.run(
      "mem_emp_001",
      employeeId,
      businessId,
      "employee",
      JSON.stringify([
        "expenses.draft",
        "documents.upload",
        "documents.view_own",
      ]),
    );
    insertMembership.run(
      "mem_acc_001",
      accountantId,
      businessId,
      "accountant",
      JSON.stringify(["reports.view", "ledger.post", "audit.view"]),
    );

    // 4. Sample active invite code
    database
      .prepare(`
      INSERT OR REPLACE INTO invite_codes (id, business_id, code, role, created_by, expires_at)
      VALUES ('inv_001', ?, 'INVITE-2026', 'employee', ?, datetime('now', '+30 days'))
    `)
      .run(businessId, ownerId);

    // 5. Chart of Accounts
    const insertAccount = database.prepare(`
      INSERT OR REPLACE INTO accounts (id, business_id, code, name, type, currency, status)
      VALUES (?, ?, ?, ?, ?, 'USD', 'active')
    `);

    const accounts = [
      {
        id: "acc_1000",
        code: "1000",
        name: "Operating Bank Account",
        type: "asset",
      },
      {
        id: "acc_1100",
        code: "1100",
        name: "Accounts Receivable",
        type: "asset",
      },
      {
        id: "acc_2000",
        code: "2000",
        name: "Accounts Payable",
        type: "liability",
      },
      {
        id: "acc_2100",
        code: "2100",
        name: "Sales Tax Payable",
        type: "liability",
      },
      { id: "acc_3000", code: "3000", name: "Owner's Equity", type: "equity" },
      {
        id: "acc_4000",
        code: "4000",
        name: "Service Revenue",
        type: "revenue",
      },
      {
        id: "acc_5000",
        code: "5000",
        name: "General Operating Expenses",
        type: "expense",
      },
    ];

    for (const acc of accounts) {
      insertAccount.run(acc.id, businessId, acc.code, acc.name, acc.type);
    }

    // 6. Sample Client
    database
      .prepare(`
      INSERT OR REPLACE INTO clients (id, business_id, name, email, phone, company, status)
      VALUES ('cli_acme_client_001', ?, 'Apex Holdings LLC', 'billing@apexholdings.com', '+1-555-0199', 'Apex Holdings', 'active')
    `)
      .run(businessId);
  });

  logger.info("Database successfully seeded with foundational records.");

  return {
    ownerUser: {
      id: ownerId,
      email: "owner@acmeservices.com",
      fullName: "Eleanor Vance",
    },
    employeeUser: {
      id: employeeId,
      email: "employee@acmeservices.com",
      fullName: "Marcus Brody",
    },
    accountantUser: {
      id: accountantId,
      email: "accountant@cpa-firm.com",
      fullName: "Sarah Jenkins, CPA",
    },
    business: { id: businessId, name: "Acme Services LLC" },
  };
}

if (
  process.argv[1] &&
  (process.argv[1].endsWith("seed.ts") || process.argv[1].endsWith("seed.js"))
) {
  try {
    seedDatabase();
    console.log("Database seeded successfully.");
    process.exit(0);
  } catch (err) {
    console.error("Seeding failed:", err);
    process.exit(1);
  }
}
