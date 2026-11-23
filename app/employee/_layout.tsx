import { Tabs } from "expo-router";
import { RoleGuard } from "@/navigation/RoleGuard";
import {
  TabBarIconContainer,
  useShellOptions,
} from "@/navigation/useShellOptions";

export default function Layout() {
  const options = useShellOptions();
  return (
    <RoleGuard requiredRole="employee">
      <Tabs screenOptions={options}>
        <Tabs.Screen
          name="index"
          options={{
            title: "Home",
            tabBarIcon: ({ focused }) => (
              <TabBarIconContainer destination="Home" focused={focused} />
            ),
          }}
        />
        <Tabs.Screen
          name="expenses"
          options={{
            title: "Expenses",
            tabBarIcon: ({ focused }) => (
              <TabBarIconContainer destination="Expenses" focused={focused} />
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
