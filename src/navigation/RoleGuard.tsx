import { Redirect } from "expo-router";
import { type PropsWithChildren, useState } from "react";
import { View } from "react-native";
import { LoadingState } from "@/components/feedback/Feedback";
import { Screen } from "@/components/layout/Screen";
import { Button } from "@/components/ui/Button";
import { FeedbackIcon } from "@/components/ui/Icon";
import { Text } from "@/components/ui/Text";
import type { Role } from "@/features/auth/schemas/session";
import { useSession } from "@/providers/SessionProvider";
import { accessState } from "./access";

export function RoleGuard({
  requiredRole,
  children,
}: PropsWithChildren<{ requiredRole: Role }>) {
  const { session, loading, signOut } = useSession();
  const [cleanupFailed, setCleanupFailed] = useState(false);
  const state = accessState(loading, session, requiredRole);

  if (state === "loading") return <LoadingState />;
  if (state === "unauthenticated") return <Redirect href="/(auth)/sign-in" />;

  // Figma 81:1450: Restricted access layout
  if (state === "forbidden")
    return (
      <Screen>
        <View className="flex-1 items-center justify-center p-6">
          <View className="mb-6 size-[107px] items-center justify-center rounded-full bg-primarySoft">
            <FeedbackIcon variant="information" size={40} />
          </View>

          <Text variant="Title" tone="text" className="mb-2 text-center">
            Permission required
          </Text>
          <Text variant="Caption" tone="muted" className="mb-6 text-center">
            This action is not authorized for your current role.
          </Text>

          <View className="mb-6 w-full max-w-sm rounded-md border border-border bg-surface p-4">
            <Text variant="Label" tone="text" className="mb-1">
              Assigned role: {session?.role ?? "none"}
            </Text>
            <Text variant="BodySmall" tone="muted">
              Required access level: {requiredRole}. Contact your organization
              owner to request role permission updates.
            </Text>
          </View>

          {cleanupFailed ? (
            <Text
              variant="BodySmall"
              tone="negative"
              accessibilityRole="alert"
              className="mb-4 text-center"
            >
              Credential cleanup failed. Restart and try again.
            </Text>
          ) : null}

          <View className="w-full max-w-sm">
            <Button
              title="Sign out"
              variant="primary"
              onPress={() => {
                signOut().catch(() => setCleanupFailed(true));
              }}
            />
          </View>
        </View>
      </Screen>
    );

  return children;
}
