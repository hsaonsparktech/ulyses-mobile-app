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
import { type InviteCodeInput, inviteCodeSchema } from "../schemas/inviteCode";

type InviteState =
  | { kind: "entry" }
  | {
      kind: "accepted";
      businessName: string;
      role: "employee" | "accountant";
    }
  | { kind: "unavailable" };

export function InviteCodeScreen() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [inviteState, setInviteState] = useState<InviteState>({
    kind: "entry",
  });

  const form = useForm<InviteCodeInput>({
    resolver: zodResolver(inviteCodeSchema),
    defaultValues: { code: "" },
  });

  const onSubmit = async (data: InviteCodeInput) => {
    setSubmitting(true);
    try {
      const code = data.code.trim().toUpperCase();
      if (code === "INVALID" || code === "EXPIRED") {
        setInviteState({ kind: "unavailable" });
      } else if (code.includes("ACC")) {
        setInviteState({
          kind: "accepted",
          businessName: "Acme Services",
          role: "accountant",
        });
      } else {
        setInviteState({
          kind: "accepted",
          businessName: "Acme Services",
          role: "employee",
        });
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (inviteState.kind === "accepted") {
    // Accepted State (Figma 41:7 / 41:275)
    return (
      <Screen>
        <View className="items-center justify-center gap-6 py-8">
          <View className="size-[107px] items-center justify-center rounded-full bg-primarySoft">
            <FeedbackIcon variant="success" size={40} />
          </View>

          <View className="items-center gap-1">
            <Text variant="Heading" className="text-center">
              You're invited
            </Text>
            <Text variant="BodySmall" tone="muted" className="text-center">
              Your business owner has shared access.
            </Text>
          </View>

          <Card>
            <View className="gap-2">
              <Text variant="Caption" tone="primary" className="font-semibold">
                WELCOME TO THE TEAM
              </Text>
              <Text variant="Title">{inviteState.businessName}</Text>
              <Text variant="BodySmall" className="capitalize">
                Role: {inviteState.role}
              </Text>
              <Text variant="Caption" tone="muted">
                Your permissions are set by the owner.
              </Text>
            </View>
          </Card>

          <View className="w-full gap-3 pt-4">
            <Button
              title="Open assigned workspace"
              variant="primary"
              onPress={() =>
                router.replace(
                  inviteState.role === "accountant"
                    ? "/accountant"
                    : "/employee",
                )
              }
            />
          </View>
        </View>
      </Screen>
    );
  }

  if (inviteState.kind === "unavailable") {
    // Access Unavailable State (Figma 59:57 / 59:155)
    return (
      <Screen>
        <View className="items-center justify-center gap-6 py-8">
          <View className="size-[107px] items-center justify-center rounded-full bg-negativeSoft">
            <FeedbackIcon variant="warning" size={40} />
          </View>

          <View className="items-center gap-1">
            <Text variant="Heading" className="text-center">
              Access unavailable
            </Text>
            <Text variant="BodySmall" tone="muted" className="text-center">
              This invitation cannot be used right now.
            </Text>
          </View>

          <Card>
            <View className="gap-1">
              <Text variant="Caption" tone="negative" className="font-semibold">
                INVITATION NOT VALID
              </Text>
              <Text variant="BodySmall" tone="muted">
                The invite code is invalid, expired, or has already been
                redeemed.
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
              title="Try another code"
              variant="secondary"
              onPress={() => {
                form.reset();
                setInviteState({ kind: "entry" });
              }}
            />
          </View>
        </View>
      </Screen>
    );
  }

  // Code Entry State (Figma 55:13 / 59:116)
  return (
    <Screen>
      <View className="gap-6 pt-2">
        <BrandHeader />

        <View className="gap-1">
          <Text variant="Heading">Join a business</Text>
          <Text variant="BodySmall" tone="muted">
            Use the access code supplied by its owner.
          </Text>
        </View>

        <View className="gap-4">
          <Controller
            control={form.control}
            name="code"
            render={({ field, fieldState }) => (
              <Input
                label="Access code"
                placeholder="Enter team invitation code"
                autoCapitalize="characters"
                value={field.value}
                onBlur={field.onBlur}
                onChangeText={field.onChange}
                error={fieldState.error?.message}
              />
            )}
          />

          <Button
            title="Verify invitation"
            variant="primary"
            loading={submitting}
            onPress={form.handleSubmit(onSubmit)}
          />

          {/* Info Card */}
          <Card>
            <View className="gap-2">
              <Text variant="Caption" tone="muted" className="font-semibold">
                AFTER YOUR INVITE IS VERIFIED
              </Text>
              <View className="gap-1">
                <Text variant="Caption" tone="muted">
                  • Assigned business access is granted automatically
                </Text>
                <Text variant="Caption" tone="muted">
                  • Your role: Employee or Accountant
                </Text>
                <Text variant="Caption" tone="muted">
                  • Available pages depend on permissions
                </Text>
              </View>
            </View>
          </Card>

          <View className="items-center pt-2">
            <Pressable
              accessibilityRole="link"
              accessibilityLabel="Already invited? Sign in"
              className="min-h-[44px] justify-center px-2"
              onPress={() => router.push("/(auth)/sign-in")}
            >
              <Text variant="Caption" tone="primary">
                Already invited? Sign in after verification.
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Screen>
  );
}
