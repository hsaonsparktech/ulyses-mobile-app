import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { View } from "react-native";
import { BrandHeader } from "@/components/layout/BrandHeader";
import { Screen } from "@/components/layout/Screen";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Text } from "@/components/ui/Text";
import { env } from "@/config/env";
import { useBusinessStore } from "@/features/businesses/store";
import { httpClient } from "@/services/api/httpClient";
import {
  type BusinessSetupInput,
  businessSetupSchema,
} from "../schemas/businessSetup";

export function BusinessSetupScreen() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  const [apiError, setApiError] = useState<string | null>(null);
  const addBusiness = useBusinessStore((s) => s.addBusiness);

  const form = useForm<BusinessSetupInput>({
    resolver: zodResolver(businessSetupSchema),
    defaultValues: {
      businessName: "",
      businessType: "Freelancer / Small business",
      currency: "USD · United States",
    },
  });

  const onSubmit = async (data: BusinessSetupInput) => {
    setSubmitting(true);
    setApiError(null);
    try {
      if (!env.mockAuth) {
        const res = await httpClient.post<{
          business: { id: string; name: string };
        }>("/api/v1/businesses", {
          businessName: data.businessName,
          businessType: data.businessType,
          currency: "USD",
        });
        addBusiness({
          name: res.business.name,
          type: data.businessType,
          currency: "USD",
        });
      } else {
        addBusiness({
          name: data.businessName,
          type: data.businessType,
          currency: "USD",
        });
      }
      // In preview/dev mode or live mode, creating business directs to the owner workspace
      router.replace("/owner");
    } catch (err: any) {
      setApiError(err?.message || "Business setup failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Screen>
      <View className="gap-6 pt-2">
        <BrandHeader />

        <View className="gap-1">
          <Text variant="Heading">Set up a business</Text>
          <Text variant="BodySmall" tone="muted">
            Add your first company to begin tracking.
          </Text>
        </View>

        {apiError && (
          <View className="rounded-lg bg-negativeSoft p-3">
            <Text variant="BodySmall" tone="negative">
              {apiError}
            </Text>
          </View>
        )}

        {/* Business Setup Form (Figma 36:477) */}
        <View className="gap-4">
          <Controller
            control={form.control}
            name="businessName"
            render={({ field, fieldState }) => (
              <Input
                label="Business name"
                placeholder="Acme Services"
                value={field.value}
                onBlur={field.onBlur}
                onChangeText={field.onChange}
                error={fieldState.error?.message}
              />
            )}
          />

          <Controller
            control={form.control}
            name="businessType"
            render={({ field, fieldState }) => (
              <Input
                label="Business type"
                placeholder="Freelancer / Small business"
                value={field.value}
                onBlur={field.onBlur}
                onChangeText={field.onChange}
                error={fieldState.error?.message}
              />
            )}
          />

          <Controller
            control={form.control}
            name="currency"
            render={({ field, fieldState }) => (
              <Input
                label="Currency"
                placeholder="USD · United States"
                value={field.value}
                onBlur={field.onBlur}
                onChangeText={field.onChange}
                error={fieldState.error?.message}
              />
            )}
          />

          {/* Multi-business Notice Card (Figma 36:494) */}
          <Card>
            <View className="gap-1">
              <Text variant="Label">Multiple businesses supported</Text>
              <Text variant="Caption" tone="muted">
                Each has its own records.
              </Text>
            </View>
          </Card>

          <Button
            title="Create business"
            variant="primary"
            loading={submitting}
            onPress={form.handleSubmit(onSubmit)}
          />
        </View>
      </View>
    </Screen>
  );
}
