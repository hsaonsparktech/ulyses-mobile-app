import { signInSchema } from "@/features/auth/schemas/session";
import { queryKeys } from "@/lib/query/keys";
import { accessState, homeForRole } from "@/navigation/access";
import { tokenName, verifiedTokens } from "@/theme/tokens";

const session = { userId: "test", role: "owner" as const, businessId: "a" };
test("validates required fields and email", () => {
  expect(
    signInSchema.safeParse({ email: "invalid", password: "" }).success,
  ).toBe(false);
  expect(
    signInSchema.safeParse({ email: "test@example.invalid", password: "test" })
      .success,
  ).toBe(true);
});
test("all access states fail closed", () => {
  expect(accessState(true, null)).toBe("loading");
  expect(accessState(false, null)).toBe("unauthenticated");
  expect(accessState(false, session, "employee")).toBe("forbidden");
  expect(accessState(false, session, "owner")).toBe("authorized");
  for (const role of ["owner", "employee", "accountant"] as const)
    expect(homeForRole(role)).toBe(`/${role}`);
});
test("query keys isolate business and role", () => {
  expect(queryKeys.resource(session, "documents")).not.toEqual(
    queryKeys.resource({ ...session, businessId: "b" }, "documents"),
  );
  expect(queryKeys.scope(session)).not.toEqual(
    queryKeys.scope({ ...session, role: "accountant" }),
  );
});
test("semantic names retain verified light/dark values", () => {
  expect(tokenName("surfaceAlt")).toBe("color/surfaceAlt");
  expect(verifiedTokens.light.primary).toBe("#2459D8");
  expect(verifiedTokens.dark.primary).toBe("#83A9FF");
});
