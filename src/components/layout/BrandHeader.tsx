import { View } from "react-native";
import { LibrosLogo } from "@/components/ui/LibrosLogo";
import { Text } from "@/components/ui/Text";

export function BrandHeader({ className = "" }: { className?: string }) {
  // Figma 36:405/371:77: 42×42px tile, 12px gap, "Libros" in Title (22px SemiBold)
  return (
    <View className={`flex-row items-center gap-3 ${className}`}>
      <LibrosLogo variant="tile" width={42} height={42} />
      <Text variant="Title" tone="text">
        Libros
      </Text>
    </View>
  );
}
