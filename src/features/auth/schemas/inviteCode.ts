import { z } from "zod";

export const inviteCodeSchema = z.object({
  code: z
    .string()
    .trim()
    .min(4, "Invitation code must be at least 4 characters."),
});

export type InviteCodeInput = z.infer<typeof inviteCodeSchema>;
