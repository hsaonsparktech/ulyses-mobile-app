export const en = {
  signIn: "Sign in",
  email: "Email",
  password: "Password",
  signOut: "Sign out",
  foundation: "Sprint 00 engineering preview",
} as const;
export type TranslationKey = keyof typeof en;
export function t(key: TranslationKey) {
  return en[key];
}
