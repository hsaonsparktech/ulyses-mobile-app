import { useRouter } from "expo-router";
import { Pressable, View } from "react-native";
import { BrandHeader } from "@/components/layout/BrandHeader";
import { Screen } from "@/components/layout/Screen";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Text } from "@/components/ui/Text";

export function WelcomeScreen() {
  const router = useRouter();

  return (
    <Screen>
      <View className="gap-6 pt-2">
        <BrandHeader />

        <View className="gap-1">
          <Text variant="Heading">Welcome to Libros</Text>
          <Text variant="BodySmall" tone="muted">
            Simple accounting for every business you manage.
          </Text>
        </View>

        {/* Specimen financial snapshot card (Figma 36:410) */}
        <Card>
          <View className="gap-3">
            <View className="flex-row flex-wrap items-center justify-between gap-1.5">
              <Text variant="Section" className="shrink">
                Your business, organized.
              </Text>
              <View className="rounded bg-surfaceAlt px-2 py-0.5">
                <Text variant="Caption" tone="muted">
                  Specimen preview
                </Text>
              </View>
            </View>

            <View className="gap-2">
              <View className="flex-row items-center justify-between py-1">
                <Text variant="BodySmall" tone="muted">
                  Income
                </Text>
                <Text variant="BodySmall" className="font-semibold">
                  $12,480
                </Text>
              </View>
              <View className="h-px bg-border" />
              <View className="flex-row items-center justify-between py-1">
                <Text variant="BodySmall" tone="muted">
                  Expenses
                </Text>
                <Text variant="BodySmall" className="font-semibold">
                  $4,250
                </Text>
              </View>
            </View>

            <View className="pt-1">
              <Text variant="Caption" tone="primary" className="font-medium">
                AI assisted. Always reviewed.
              </Text>
            </View>
          </View>
        </Card>

        {/* Call to actions */}
        <View className="gap-3 pt-2">
          <Button
            title="Create account"
            variant="primary"
            onPress={() => router.push("/(auth)/register")}
          />
          <Button
            testID="sign-in-button"
            title="Sign in"
            variant="secondary"
            onPress={() => router.push("/(auth)/sign-in")}
          />
        </View>

        {/* Footnote & Invite code shortcut */}
        <View className="items-center gap-2 pt-4">
          <View className="flex-row flex-wrap items-center justify-center gap-1">
            <Text variant="BodySmall" tone="muted">
              Have an employee or accountant invite?
            </Text>
            <Pressable
              accessibilityRole="link"
              accessibilityLabel="Use access code"
              hitSlop={8}
              onPress={() => router.push("/(auth)/invite-code")}
            >
              <Text variant="Label" tone="primary">
                Use access code
              </Text>
            </Pressable>
          </View>
          <Text variant="Caption" tone="muted">
            No bank connection required
          </Text>
        </View>
      </View>
    </Screen>
  );
}
