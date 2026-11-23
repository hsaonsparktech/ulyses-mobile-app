import { z } from "zod";

const schema = z.object({
  apiBaseUrl: z.url(),
  mockAuth: z.enum(["true", "false"]),
});
const parsed = schema.parse({
  apiBaseUrl:
    process.env.EXPO_PUBLIC_API_BASE_URL ?? "https://api.example.invalid",
  mockAuth: process.env.EXPO_PUBLIC_ENABLE_MOCK_AUTH ?? "true",
});
export const env = {
  apiBaseUrl: parsed.apiBaseUrl,
  mockAuth: __DEV__ && parsed.mockAuth === "true",
};
