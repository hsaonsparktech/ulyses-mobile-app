import "../global.css";
import { Inter_400Regular } from "@expo-google-fonts/inter/400Regular";
import { Inter_600SemiBold } from "@expo-google-fonts/inter/600SemiBold";
import { Inter_700Bold } from "@expo-google-fonts/inter/700Bold";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { Providers } from "@/app/Providers";
import { ErrorState, LoadingState } from "@/components/feedback/Feedback";
import { useThemeColors, useThemeMode } from "@/theme/ThemeProvider";

function Navigation() {
  const colors = useThemeColors();
  const mode = useThemeMode();
  return (
    <>
      <StatusBar style={mode === "dark" ? "light" : "dark"} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.canvas },
        }}
      />
    </>
  );
}
export default function RootLayout() {
  const [loaded, error] = useFonts({
    Inter_400Regular,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  useEffect(() => {
    if (loaded || error) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [loaded, error]);

  return (
    <Providers>
      {error ? (
        <ErrorState message="Unable to load Inter fonts. Restart the app." />
      ) : loaded ? (
        <Navigation />
      ) : (
        <LoadingState />
      )}
    </Providers>
  );
}
