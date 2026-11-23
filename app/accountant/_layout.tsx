import { Tabs } from "expo-router";
import { RoleGuard } from "@/navigation/RoleGuard";
import {
  TabBarIconContainer,
  useShellOptions,
} from "@/navigation/useShellOptions";

export default function Layout() {
  const options = useShellOptions();
  return (
    <RoleGuard requiredRole="accountant">
      <Tabs screenOptions={options}>
        <Tabs.Screen
          name="index"
          options={{
            title: "Overview",
            tabBarIcon: ({ focused }) => (
              <TabBarIconContainer destination="Overview" focused={focused} />
            ),
          }}
        />
        <Tabs.Screen
          name="reports"
          options={{
            title: "Reports",
            tabBarIcon: ({ focused }) => (
              <TabBarIconContainer destination="Reports" focused={focused} />
            ),
          }}
        />
        <Tabs.Screen
          name="documents"
          options={{
            title: "Documents",
            tabBarIcon: ({ focused }) => (
              <TabBarIconContainer destination="Documents" focused={focused} />
            ),
          }}
        />
        <Tabs.Screen
          name="account"
          options={{
            title: "Account",
            tabBarIcon: ({ focused }) => (
              <TabBarIconContainer destination="Account" focused={focused} />
            ),
          }}
        />
      </Tabs>
    </RoleGuard>
  );
}
