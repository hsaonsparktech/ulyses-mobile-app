import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { Pressable, View } from "react-native";
import { BrandHeader } from "@/components/layout/BrandHeader";
import { Screen } from "@/components/layout/Screen";
import { Button } from "@/components/ui/Button";
import { UtilityIcon } from "@/components/ui/Icon";
import { Input } from "@/components/ui/Input";
import { Text } from "@/components/ui/Text";
import { env } from "@/config/env";
import { httpClient } from "@/services/api/httpClient";
import { type RegisterInput, registerSchema } from "../schemas/register";

export function RegisterScreen() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  const [apiError, setApiError] = useState<string | null>(null);

  const form = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      fullName: "",
      email: "",
      password: "",
      termsAccepted: false,
    },
  });

  const onSubmit = async (data: RegisterInput) => {
    setSubmitting(true);
    setApiError(null);
    try {
      if (!env.mockAuth) {
        await httpClient.post("/api/v1/auth/register", data);
      }
      // Navigate to email verification with passed email
      router.push({
        pathname: "/(auth)/verify-email",
        params: { email: data.email },
      });
    } catch (err: any) {
      setApiError(err?.message || "Registration failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Screen>
      <View className="gap-6 pt-2">
        <BrandHeader />

        <View className="gap-1">
          <Text variant="Heading">Create your account</Text>
          <Text variant="BodySmall" tone="muted">
            Start with your details, then set up a business.
          </Text>
        </View>

        {apiError && (
          <View className="rounded-lg bg-negativeSoft p-3">
            <Text variant="BodySmall" tone="negative">
              {apiError}
            </Text>
          </View>
        )}

        {/* Registration Form (Figma 36:423) */}
        <View className="gap-4">
          <Controller
            control={form.control}
            name="fullName"
            render={({ field, fieldState }) => (
              <Input
                label="Full name"
                placeholder="Enter your name"
                autoComplete="name"
                value={field.value}
                onBlur={field.onBlur}
                onChangeText={field.onChange}
                error={fieldState.error?.message}
              />
            )}
          />

          <Controller
            control={form.control}
            name="email"
            render={({ field, fieldState }) => (
              <Input
                label="Work email"
                placeholder="you@business.com"
                autoCapitalize="none"
                autoComplete="email"
                keyboardType="email-address"
                value={field.value}
                onBlur={field.onBlur}
                onChangeText={field.onChange}
                error={fieldState.error?.message}
              />
            )}
          />

          <Controller
            control={form.control}
            name="password"
            render={({ field, fieldState }) => (
              <Input
                label="Password"
                placeholder="Create a strong password"
                secureTextEntry
                autoComplete="new-password"
                value={field.value}
                onBlur={field.onBlur}
                onChangeText={field.onChange}
                error={fieldState.error?.message}
              />
            )}
          />

          {/* Terms checkbox row (Figma 36:443) */}
          <Controller
            control={form.control}
            name="termsAccepted"
            render={({ field, fieldState }) => (
              <View className="gap-1">
                <Pressable
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: field.value }}
                  accessibilityLabel="I agree to the Terms and Privacy Policy"
                  className="flex-row items-center gap-3 py-1"
                  hitSlop={8}
                  onPress={() => field.onChange(!field.value)}
                >
                  <View
                    className={`size-5 items-center justify-center rounded-[5px] border ${
                      field.value
                        ? "border-primary bg-primary"
                        : "border-border bg-surface"
                    }`}
                  >
                    {field.value ? (
                      <UtilityIcon
                        name="selection-check"
                        size={14}
                        color="#FFFFFF"
                      />
                    ) : null}
                  </View>
                  <Text variant="Caption" tone="muted" className="flex-1">
                    I agree to the Terms and Privacy Policy
                  </Text>
                </Pressable>
                {fieldState.error ? (
                  <Text
                    variant="Caption"
                    tone="negative"
                    accessibilityRole="alert"
                  >
                    {fieldState.error.message}
                  </Text>
                ) : null}
              </View>
            )}
          />

          <Button
            title="Create account"
            variant="primary"
            loading={submitting}
            onPress={form.handleSubmit(onSubmit)}
          />

          <View className="items-center gap-2 pt-2">
            <View className="flex-row flex-wrap items-center justify-center gap-1">
              <Text variant="BodySmall" tone="muted">
                Already have an account?
              </Text>
              <Pressable
                accessibilityRole="link"
                accessibilityLabel="Sign in"
                hitSlop={8}
                onPress={() => router.push("/(auth)/sign-in")}
              >
                <Text variant="Label" tone="primary">
                  Sign in
                </Text>
              </Pressable>
            </View>

            <Text variant="Caption" tone="muted" className="text-center">
              Trial: 14 days · Pro: $20/mo or $200/year
            </Text>
          </View>
        </View>
      </View>
    </Screen>
  );
}
