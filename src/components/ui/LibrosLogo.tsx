import { Image, type ImageStyle, type StyleProp } from "react-native";

// Unmodified exact tile: SHA256 32929c6505a6f231e0b64efa7cbb9d6b6649fab1709cca12423bbd40e2427b2e.
// Compact is the handoff's DERIVED transparent PNG, not a direct Figma export.
const sources = {
  tile: require("../../../assets/branding/libros_app_tile_exact_1254.png"),
  compact: require("../../../assets/branding/libros_open_book_mark_transparent_DERIVED.png"),
};

export type LibrosLogoProps = {
  variant?: "tile" | "compact";
  width?: number;
  height?: number;
  style?: StyleProp<ImageStyle>;
};

export function LibrosLogo({
  variant = "tile",
  width,
  height,
  style,
}: LibrosLogoProps) {
  // Figma 371:77 auth header tile is 42×42px; 371:88 compact book mark is 22×15.98px (ratio 890/650)
  const defaultWidth = variant === "tile" ? 42 : 22;
  const targetWidth = width ?? defaultWidth;
  const aspectRatio = variant === "tile" ? 1 : 890 / 650;
  const targetHeight = height ?? targetWidth / aspectRatio;

  return (
    <Image
      source={sources[variant]}
      accessibilityRole="image"
      accessibilityLabel={
        variant === "tile"
          ? "Libros official app tile"
          : "Libros open book mark"
      }
      resizeMode="contain"
      style={[
        {
          width: targetWidth,
          height: targetHeight,
          aspectRatio,
          maxWidth: "100%",
          alignSelf: "center",
        },
        variant === "tile" && targetWidth === 42 ? { borderRadius: 12 } : null,
        style,
      ]}
    />
  );
}
