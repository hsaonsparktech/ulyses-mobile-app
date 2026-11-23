import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { Pressable, View } from "react-native";
import { BrandHeader } from "@/components/layout/BrandHeader";
import { Screen } from "@/components/layout/Screen";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { FeedbackIcon } from "@/components/ui/Icon";
import { Input } from "@/components/ui/Input";
import { Text } from "@/components/ui/Text";
import { env } from "@/config/env";
import { httpClient } from "@/services/api/httpClient";
import {
  type ForgotPasswordInput,
  forgotPasswordSchema,
} from "../schemas/forgotPassword";

export function ForgotPasswordScreen() {
  const router = useRouter();
  const [submittedEmail, setSubmittedEmail] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const form = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  });

  const onSubmit = async (data: ForgotPasswordInput) => {
    setSubmitting(true);
    setApiError(null);
    try {
      if (!env.mockAuth) {
        await httpClient.post("/api/v1/auth/forgot-password", {
          email: data.email,
        });
      }
      setSubmittedEmail(data.email);
    } catch (err: any) {
      setApiError(err?.message || "Failed to submit recovery request.");
    } finally {
      setSubmitting(false);
    }
  };

  if (submittedEmail) {
    // Confirmation state (Figma 89:514)
    return (
      <Screen>
        <View className="items-center justify-center gap-6 py-8">
          <View className="size-[107px] items-center justify-center rounded-full bg-primarySoft">
            <FeedbackIcon variant="success" size={40} />
          </View>

          <View className="items-center gap-1">
            <Text variant="Title" className="text-center">
              Check your email
            </Text>
            <Text variant="Caption" tone="muted" className="text-center">
              Password reset request
            </Text>
          </View>

          <Card>
            <View className="gap-2">
              <Text variant="Section">Reset instructions prepared</Text>
              <Text variant="BodySmall" tone="muted">
                Follow the secure reset link sent to {submittedEmail}. Check
                your spam folder if the email does not appear within a few
                minutes.
              </Text>
            </View>
          </Card>

          <View className="w-full gap-3 pt-4">
            <Button
              title="Return to sign in"
              variant="primary"
              onPress={() => router.push("/(auth)/sign-in")}
            />
            <Button
              title="Back to welcome"
              variant="secondary"
              onPress={() => router.push("/(auth)/welcome")}
            />
          </View>
        </View>
      </Screen>
    );
  }

  // Request state (Figma 36:1074)
  return (
    <Screen>
      <View className="gap-6 pt-2">
        <BrandHeader />

        <View className="gap-1">
          <Text variant="Heading">Reset password</Text>
          <Text variant="BodySmall" tone="muted">
            We'll send a secure reset link to your email.
          </Text>
        </View>

        {apiError && (
          <View className="rounded-lg bg-negativeSoft p-3">
            <Text variant="BodySmall" tone="negative">
              {apiError}
            </Text>
          </View>
        )}

        <View className="gap-4">
          <Controller
            control={form.control}
            name="email"
            render={({ field, fieldState }) => (
              <Input
                label="Email address"
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

          <Button
            title="Send reset link"
            variant="primary"
            loading={submitting}
            onPress={form.handleSubmit(onSubmit)}
          />

          {/* Security notice card (Figma 36:1087) */}
          <View className="rounded-md border border-border bg-primarySoft p-4">
            <View className="gap-1">
              <Text variant="Label" tone="primary">
                Protect your account
              </Text>
              <Text variant="Caption" tone="muted">
                Do not share passwords or verification codes. Reset links expire
                after use.
              </Text>
            </View>
          </View>

          <View className="items-center pt-2">
            <Pressable
              accessibilityRole="link"
              accessibilityLabel="Back to sign in"
              className="min-h-[44px] justify-center px-2"
              onPress={() => router.push("/(auth)/sign-in")}
            >
              <Text variant="Label" tone="primary">
                Back to sign in
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Screen>
  );
}
