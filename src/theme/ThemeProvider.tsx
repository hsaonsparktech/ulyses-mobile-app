import { vars } from "nativewind";
import { createContext, type PropsWithChildren, useContext } from "react";
import { useColorScheme, View } from "react-native";
import { type ThemeMode, themeVariables, verifiedTokens } from "./tokens";

const Context = createContext<ThemeMode>("light");
export function ThemeProvider({ children }: PropsWithChildren) {
  const mode = useColorScheme() === "dark" ? "dark" : "light";
  return (
    <Context.Provider value={mode}>
      <View
        style={[
          { flex: 1, backgroundColor: verifiedTokens[mode].canvas },
          vars(themeVariables(mode)),
        ]}
      >
        {children}
      </View>
    </Context.Provider>
  );
}
export const useThemeMode = () => useContext(Context);
export function useThemeColors() {
  return verifiedTokens[useThemeMode()];
}
