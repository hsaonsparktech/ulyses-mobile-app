import { zodResolver } from "@hookform/resolvers/zod";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { Pressable, TextInput as RNTextInput, View } from "react-native";
import { BrandHeader } from "@/components/layout/BrandHeader";
import { Screen } from "@/components/layout/Screen";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Text } from "@/components/ui/Text";
import { env } from "@/config/env";
import { httpClient } from "@/services/api/httpClient";
import {
  type VerifyEmailInput,
  verifyEmailSchema,
} from "../schemas/verifyEmail";

const OTP_SLOTS = [
  "otp-cell-0",
  "otp-cell-1",
  "otp-cell-2",
  "otp-cell-3",
  "otp-cell-4",
  "otp-cell-5",
] as const;

export function VerifyEmailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ email?: string }>();
  const [submitting, setSubmitting] = useState(false);
  const [resendStatus, setResendStatus] = useState<string | null>(null);

  const [apiError, setApiError] = useState<string | null>(null);

  const inputRef = useRef<RNTextInput>(null);

  const form = useForm<VerifyEmailInput>({
    resolver: zodResolver(verifyEmailSchema),
    defaultValues: {
      code: "",
    },
  });

  const onSubmit = async (data: VerifyEmailInput) => {
    setSubmitting(true);
    setApiError(null);
    try {
      if (!env.mockAuth && params.email) {
        await httpClient.post("/api/v1/auth/verify-email", {
          email: params.email,
          code: data.code,
        });
      }
      // In mock/preview flow or post verification, valid 6-digit code advances to business setup
      router.push("/(auth)/business-setup");
    } catch (err: any) {
      setApiError(
        err?.message || "Verification failed. Check the 6-digit code.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleResend = () => {
    setResendStatus("New verification code sent to your email.");
  };

  return (
    <Screen>
      <View className="gap-6 pt-2">
        <BrandHeader />

        <View className="gap-1">
          <Text variant="Heading">Verify your email</Text>
          <Text variant="BodySmall" tone="muted">
            {params.email
              ? `Enter the six-digit code sent to ${params.email}.`
              : "Enter the six-digit code sent to your inbox."}
          </Text>
        </View>

        {apiError && (
          <View className="rounded-lg bg-negativeSoft p-3">
            <Text variant="BodySmall" tone="negative">
              {apiError}
            </Text>
          </View>
        )}

        {/* 6-Digit OTP Code Input (Figma 36:449) */}
        <View className="gap-4">
          <Controller
            control={form.control}
            name="code"
            render={({ field, fieldState }) => {
              const codeVal = field.value || "";

              return (
                <View className="gap-2">
                  {/* Invisible real TextInput for full keyboard / paste support */}
                  <RNTextInput
                    ref={inputRef}
                    value={field.value}
                    onChangeText={(val) => {
                      const clean = val.replace(/\D/g, "").slice(0, 6);
                      field.onChange(clean);
                    }}
                    keyboardType="number-pad"
                    maxLength={6}
                    autoFocus
                    accessibilityLabel="6-digit verification code"
                    className="absolute size-0 opacity-0"
                  />

                  {/* 6 Visual OTP Cells */}
                  <Pressable
                    onPress={() => inputRef.current?.focus()}
                    className="flex-row justify-between py-2"
                    accessibilityRole="button"
                    accessibilityLabel="Enter verification code"
                  >
                    {OTP_SLOTS.map((slotId, slotIndex) => {
                      const digit = codeVal[slotIndex] || "";
                      const isFocused =
                        codeVal.length === slotIndex ||
                        (codeVal.length === 6 && slotIndex === 5);
                      return (
                        <View
                          key={slotId}
                          className={`h-12 w-11 items-center justify-center rounded-[14px] border bg-surface ${
                            fieldState.error
                              ? "border-negative"
                              : isFocused
                                ? "border-primary"
                                : "border-border"
                          }`}
                        >
                          <Text
                            variant="Section"
                            className="font-semibold text-center"
                          >
                            {digit}
                          </Text>
                        </View>
                      );
                    })}
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
              );
            }}
          />

          <View className="flex-row items-center justify-between">
            <Text variant="Caption" tone="muted">
              Expires in 09:32
            </Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Resend code"
              hitSlop={8}
              onPress={handleResend}
            >
              <Text variant="Label" tone="primary">
                Resend code
              </Text>
            </Pressable>
          </View>

          {resendStatus ? (
            <Text variant="Caption" tone="primary" className="text-center">
              {resendStatus}
            </Text>
          ) : null}

          {/* Note Card (Figma 36:472) */}
          <Card>
            <View className="gap-1">
              <Text variant="Label">Check your spam folder</Text>
              <Text variant="BodySmall" tone="muted">
                Codes expire and are single-use.
              </Text>
            </View>
          </Card>

          <Button
            title="Verify email"
            variant="primary"
            loading={submitting}
            onPress={form.handleSubmit(onSubmit)}
          />
        </View>
      </View>
    </Screen>
  );
}
