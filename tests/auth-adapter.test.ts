import { unavailableAuth } from "@/features/auth/api/adapter";
import { createMockAuth } from "@/mocks/auth-adapter";

test("production adapter never fabricates authenticated sessions", async () => {
  const signal = new AbortController().signal;
  await expect(unavailableAuth.restore(signal)).resolves.toBeNull();
  await expect(
    unavailableAuth.signIn(
      { email: "test@example.invalid", password: "test" },
      signal,
    ),
  ).rejects.toThrow("not connected");
});

test("preview sign-in requires an explicit mock identity and honors cancellation", async () => {
  const adapter = createMockAuth("employee");
  const controller = new AbortController();
  await expect(
    adapter.signIn(
      { email: "other@example.invalid", password: "test" },
      controller.signal,
    ),
  ).rejects.toThrow("Development preview");
  await expect(
    adapter.signIn(
      { email: "preview@example.invalid", password: "test" },
      controller.signal,
    ),
  ).resolves.toMatchObject({ role: "employee" });
  controller.abort();
  await expect(
    adapter.signIn(
      { email: "preview@example.invalid", password: "test" },
      controller.signal,
    ),
  ).rejects.toThrow();
});
