import { useRouter } from "expo-router";
import { useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { LibrosLogo } from "@/components/ui/LibrosLogo";
import { SvgIcon } from "@/components/ui/SvgIcon";
import { useSession } from "@/providers/SessionProvider";
import { RequestAccessModal } from "../components/RequestAccessModal";
import { useEmployeeStore } from "../store";

export function EmployeeAccountScreen() {
  const router = useRouter();
  const { session, signOut } = useSession();
  const permissions = useEmployeeStore((s) => s.permissions);
  const [requestModalVisible, setRequestModalVisible] = useState(false);

  const handleSignOut = async () => {
    try {
      await signOut();
      router.replace("/sign-in");
    } catch {
      router.replace("/sign-in");
    }
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

          {/* Role Badge Figma 165:73 */}
          <View className="flex-row items-center bg-brand-primary/10 px-3 py-1.5 rounded-full space-x-1.5 border border-brand-primary/20">
            <SvgIcon name="user" size={14} color="#1570EF" />
            <Text className="text-xs font-bold text-brand-primary tracking-wider">
              EMPLOYEE
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
            Access profile
          </Text>
          <Text className="text-xs text-content-secondary mt-0.5">
            Figma Frame 41:184 · Role Permissions & Security
          </Text>
        </View>

        {/* Authorized Business Card Figma 41:196 */}
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
                  Business ID: BIZ-90214
                </Text>
              </View>
            </View>
            <Badge variant="primary" size="sm" label="Restricted" />
          </View>

          <View className="border-t border-border-subtle pt-3 space-y-1.5">
            <View className="flex-row justify-between">
              <Text className="text-xs text-content-secondary">
                Assigned User
              </Text>
              <Text className="text-xs font-semibold text-content-primary">
                {session?.userId
                  ? `employee-${session.userId}`
                  : "employee@acmeservices.com"}
              </Text>
            </View>
            <View className="flex-row justify-between">
              <Text className="text-xs text-content-secondary">
                Role Assignment
              </Text>
              <Text className="text-xs font-semibold text-brand-primary">
                Employee · Scoped
              </Text>
            </View>
            <View className="flex-row justify-between">
              <Text className="text-xs text-content-secondary">
                Granted by Owner
              </Text>
              <Text className="text-xs font-semibold text-content-primary">
                Sarah Jenkins
              </Text>
            </View>
          </View>
        </View>

        {/* Permissions Matrix Figma 41:200 */}
        <View className="bg-surface-secondary rounded-2xl p-5 border border-border-subtle mb-6">
          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-base font-bold text-content-primary">
              Your permissions
            </Text>
            <Text className="text-xs text-content-secondary">
              Role: Employee
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
                  variant={perm.status === "Enabled" ? "success" : "default"}
                  size="sm"
                  label={perm.status}
                />
              </View>
            ))}
          </View>
        </View>

        {/* Request Elevated Access Button Figma 84:48 */}
        <View className="mb-6">
          <Button
            variant="secondary"
            onPress={() => setRequestModalVisible(true)}
            title="Request Elevated Access"
          />
          <Text className="text-xs text-content-secondary text-center mt-2">
            Submit a request to the business owner for additional roles or
            permissions.
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

      {/* Elevated Access Request Modal */}
      <RequestAccessModal
        visible={requestModalVisible}
        onClose={() => setRequestModalVisible(false)}
      />
    </View>
  );
}
