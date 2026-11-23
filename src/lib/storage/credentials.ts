import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

const key = "libros.access-token";
export const credentials = {
  read: async () =>
    Platform.OS === "web" ? null : SecureStore.getItemAsync(key),
  write: async (token: string) => {
    if (Platform.OS === "web")
      throw new Error("Secure session persistence requires Android or iOS.");
    await SecureStore.setItemAsync(key, token, {
      keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
    });
  },
  clear: async () => {
    if (Platform.OS !== "web") await SecureStore.deleteItemAsync(key);
  },
};
