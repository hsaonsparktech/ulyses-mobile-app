import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Redirect, useRouter } from "expo-router";
import { Controller, useForm } from "react-hook-form";
import { Pressable, View } from "react-native";
import { ErrorState, LoadingState } from "@/components/feedback/Feedback";
import { BrandHeader } from "@/components/layout/BrandHeader";
import { Screen } from "@/components/layout/Screen";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Text } from "@/components/ui/Text";
import { env } from "@/config/env";
import { homeForRole } from "@/navigation/access";
import { useSession } from "@/providers/SessionProvider";
import { useUiStore } from "@/stores/ui";
import { type SignInInput, signInSchema } from "../schemas/session";

export function SignInScreen() {
  const router = useRouter();
  const { session, loading, error, signIn } = useSession();
  const { previewRole, setPreviewRole } = useUiStore();

  const form = useForm<SignInInput>({
    resolver: zodResolver(signInSchema),
    defaultValues: {
      email: env.mockAuth ? "preview@example.invalid" : "",
      password: env.mockAuth ? "secret123" : "",
    },
  });

  // Only void enters the mutation cache; credentials stay in transient form memory.
  const mutation = useMutation<void, Error, void>({
    mutationFn: async () => {
      const input = signInSchema.parse(form.getValues());
      try {
        await signIn(input);
      } finally {
        form.resetField("password");
      }
    },
    gcTime: 0,
  });

  if (loading) return <LoadingState />;
  if (session) return <Redirect href={homeForRole(session.role)} />;

  return (
    <Screen>
      <View className="gap-6 pt-2">
        <BrandHeader />

        <View className="gap-1">
          <Text variant="Heading">Sign in</Text>
          <Text variant="BodySmall" tone="muted">
            Enter your Libros account credentials.
          </Text>
        </View>

        {/* Credentials Form (Figma 36:1050 / 59:14 / 59:92) */}
        <View className="gap-4">
          <Controller
            control={form.control}
            name="email"
            render={({ field, fieldState }) => (
              <Input
                label="Email address"
                placeholder="Enter your email"
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

          <View>
            <Controller
              control={form.control}
              name="password"
              render={({ field, fieldState }) => (
                <Input
                  label="Password"
                  placeholder="Enter password"
                  secureTextEntry
                  autoComplete="current-password"
                  value={field.value}
                  onBlur={field.onBlur}
                  onChangeText={field.onChange}
                  error={fieldState.error?.message}
                />
              )}
            />

            <View className="items-end pt-1">
              <Pressable
                accessibilityRole="link"
                accessibilityLabel="Forgot password?"
                className="min-h-[44px] justify-center px-1"
                onPress={() => router.push("/(auth)/forgot-password")}
              >
                <Text variant="Caption" tone="primary">
                  Forgot password?
                </Text>
              </Pressable>
            </View>
          </View>

          {error ? <ErrorState message={error} /> : null}
          {mutation.error ? (
            <ErrorState message={mutation.error.message} />
          ) : null}

          <Button
            title="Continue securely"
            variant="primary"
            loading={mutation.isPending}
            onPress={form.handleSubmit(() => mutation.mutate())}
          />

          <View className="h-px bg-border my-1" />

          <Text variant="Caption" tone="muted" className="text-center">
            Access will follow your assigned permissions.
          </Text>
        </View>

        {/* Team Access Invitation Card (Figma 36:1070) */}
        <Card>
          <View className="gap-1">
            <Text variant="Label">Joining an existing business?</Text>
            <Pressable
              accessibilityRole="link"
              accessibilityLabel="Redeem a valid team access code"
              className="min-h-[44px] justify-center"
              onPress={() => router.push("/(auth)/invite-code")}
            >
              <Text variant="Caption" tone="primary">
                Redeem a valid team access code →
              </Text>
            </Pressable>
          </View>
        </Card>

        {/* Mock auth role selector (DEV only) */}
        {env.mockAuth ? (
          <Card>
            <Text variant="Label">Development mock authentication</Text>
            <Text variant="Caption" tone="muted">
              Select an authorized preview role for testing:
            </Text>
            <View className="flex-row gap-2 pt-2">
              {(["owner", "employee", "accountant"] as const).map((role) => (
                <View key={role} className="flex-1">
                  <Button
                    title={role}
                    variant={previewRole === role ? "primary" : "secondary"}
                    disabled={mutation.isPending}
                    onPress={() => setPreviewRole(role)}
                  />
                </View>
              ))}
            </View>
          </Card>
        ) : (
          <Text variant="Caption" tone="muted" className="text-center">
            Authentication endpoints have not been connected.
          </Text>
        )}
      </View>
    </Screen>
  );
}
