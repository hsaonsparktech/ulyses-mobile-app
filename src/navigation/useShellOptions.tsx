import { View } from "react-native";
import { type NavDestination, NavIcon } from "@/components/ui/Icon";
import { useThemeColors } from "@/theme/ThemeProvider";
import { typographyStyle } from "@/theme/tokens";

export function TabBarIconContainer({
  destination,
  focused,
}: {
  destination: NavDestination;
  focused: boolean;
}) {
  const colors = useThemeColors();
  return (
    <View
      style={{
        width: 23,
        height: 23,
        borderRadius: 7,
        backgroundColor: focused ? colors.primarySoft : colors.surfaceAlt,
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
      }}
      accessibilityRole="image"
      accessibilityLabel={`${destination} tab icon`}
    >
      <NavIcon
        destination={destination}
        state={focused ? "Selected" : "Default"}
        size={23}
      />
    </View>
  );
}

export function useShellOptions() {
  const colors = useThemeColors();
  return {
    headerShown: false,
    tabBarActiveTintColor: colors.primary,
    tabBarInactiveTintColor: colors.muted,
    tabBarActiveBackgroundColor: colors.primarySoft,
    tabBarStyle: {
      backgroundColor: colors.surface,
      borderTopColor: colors.border,
      height: 73,
      paddingTop: 8,
      paddingBottom: 6,
    },
    tabBarLabelStyle: {
      ...typographyStyle("Caption"),
      marginTop: 4,
    },
    sceneStyle: { backgroundColor: colors.canvas },
  };
}
