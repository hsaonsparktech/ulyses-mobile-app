import { Tabs } from "expo-router";
import { RoleGuard } from "@/navigation/RoleGuard";
import {
  TabBarIconContainer,
  useShellOptions,
} from "@/navigation/useShellOptions";

export default function Layout() {
  const options = useShellOptions();
  return (
    <RoleGuard requiredRole="owner">
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
          name="activity"
          options={{
            title: "Activity",
            tabBarIcon: ({ focused }) => (
              <TabBarIconContainer destination="Activity" focused={focused} />
            ),
          }}
        />
        <Tabs.Screen
          name="invoices"
          options={{
            title: "Invoices",
            tabBarIcon: ({ focused }) => (
              <TabBarIconContainer destination="Invoices" focused={focused} />
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
          name="ai"
          options={{
            title: "Libros AI",
            tabBarIcon: ({ focused }) => (
              <TabBarIconContainer destination="Libros AI" focused={focused} />
            ),
          }}
        />
        <Tabs.Screen
          name="reports"
          options={{
            href: null,
          }}
        />
      </Tabs>
    </RoleGuard>
  );
}
