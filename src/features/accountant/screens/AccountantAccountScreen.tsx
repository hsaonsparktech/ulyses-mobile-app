import { useRouter } from "expo-router";
import { Alert, ScrollView, Text, View } from "react-native";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { LibrosLogo } from "@/components/ui/LibrosLogo";
import { SvgIcon } from "@/components/ui/SvgIcon";
import { useSession } from "@/providers/SessionProvider";
import { useAccountantStore } from "../store";

export function AccountantAccountScreen() {
  const router = useRouter();
  const { session, signOut } = useSession();
  const permissions = useAccountantStore((s) => s.permissions);

  const handleSignOut = async () => {
    try {
      await signOut();
      router.replace("/sign-in");
    } catch {
      router.replace("/sign-in");
    }
  };

  const handleExportAuditTrail = () => {
    Alert.alert(
      "Audit Trail Exported",
      "Accountant session and access log package compiled and saved to device.",
      [{ text: "OK" }],
    );
  };

  return (
    <View className="flex-1 bg-surface-primary">
      {/* Header Bar */}
      <View className="px-6 pt-12 pb-4 bg-surface-primary border-b border-border-subtle">
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center space-x-2.5">
            <LibrosLogo variant="compact" width={22} height={15.98} />
            <Text className="text-xl font-bold text-content-primary">
              Libros
            </Text>
          </View>

          {/* Role Badge Figma 166:71 */}
          <View className="flex-row items-center bg-brand-primary/10 px-3 py-1.5 rounded-full space-x-1.5 border border-brand-primary/20">
            <SvgIcon name="dollar-sign" size={14} color="#1570EF" />
            <Text className="text-xs font-bold text-brand-primary tracking-wider">
              ACCOUNTANT
            </Text>
          </View>
        </View>
      </View>

      <ScrollView
        className="flex-1 px-6 py-5"
        contentContainerStyle={{ paddingBottom: 60 }}
      >
        {/* Title */}
        <View className="mb-5">
          <Text className="text-2xl font-bold text-content-primary">
            Accountant profile
          </Text>
          <Text className="text-xs text-content-secondary mt-0.5">
            Figma Frame 84:205 · Engagement & Permissions
          </Text>
        </View>

        {/* Assigned Client Card */}
        <View className="bg-surface-secondary rounded-2xl p-5 border border-border-subtle mb-6">
          <View className="flex-row items-center justify-between mb-3">
            <View className="flex-row items-center space-x-2.5">
              <View className="w-10 h-10 rounded-full bg-brand-primary/10 items-center justify-center">
                <SvgIcon name="shield" size={20} color="#1570EF" />
              </View>
              <View>
                <Text className="text-base font-bold text-content-primary">
                  Acme Services LLC
                </Text>
                <Text className="text-xs text-content-secondary">
                  Client ID: CLIENT-ACME-09
                </Text>
              </View>
            </View>
            <Badge variant="primary" size="sm" label="Client Scoped" />
          </View>

          <View className="border-t border-border-subtle pt-3 space-y-1.5">
            <View className="flex-row justify-between">
              <Text className="text-xs text-content-secondary">
                Assigned Accountant
              </Text>
              <Text className="text-xs font-semibold text-content-primary">
                {session?.userId
                  ? `accountant-${session.userId}`
                  : "accountant@cpa-firm.com"}
              </Text>
            </View>
            <View className="flex-row justify-between">
              <Text className="text-xs text-content-secondary">
                Engagement Type
              </Text>
              <Text className="text-xs font-semibold text-brand-primary">
                Tax Prep & Financial Advisory
              </Text>
            </View>
            <View className="flex-row justify-between">
              <Text className="text-xs text-content-secondary">
                Authorization Term
              </Text>
              <Text className="text-xs font-semibold text-content-primary">
                FY 2026 Active
              </Text>
            </View>
          </View>
        </View>

        {/* Permissions & Security Matrix Figma 84:205 & 84:188 */}
        <View className="bg-surface-secondary rounded-2xl p-5 border border-border-subtle mb-6">
          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-base font-bold text-content-primary">
              Accountant Scope Matrix
            </Text>
            <Text className="text-xs text-content-secondary">
              Role: Accountant
            </Text>
          </View>

          <View className="space-y-3">
            {permissions.map((perm) => (
              <View
                key={perm.id}
                className="flex-row items-start justify-between py-2 border-b border-border-subtle/40"
              >
                <View className="flex-1 pr-3">
                  <Text className="text-sm font-semibold text-content-primary">
                    {perm.name}
                  </Text>
                  <Text className="text-xs text-content-secondary mt-0.5">
                    {perm.description}
                  </Text>
                </View>
                <Badge
                  variant={perm.status === "Granted" ? "success" : "default"}
                  size="sm"
                  label={perm.status}
                />
              </View>
            ))}
          </View>
        </View>

        {/* Export Audit Log */}
        <View className="mb-6">
          <Button
            variant="secondary"
            onPress={handleExportAuditTrail}
            title="Export Session Audit Log"
          />
          <Text className="text-xs text-content-secondary text-center mt-2">
            Generate an encrypted compliance audit log for CPA records.
          </Text>
        </View>

        {/* Sign Out Button */}
        <View className="pt-2">
          <Button
            variant="destructive"
            onPress={handleSignOut}
            title="Sign Out"
          />
        </View>
      </ScrollView>
    </View>
  );
}
