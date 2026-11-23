import Svg, { Path, type SvgProps } from "react-native-svg";
import { useThemeColors } from "@/theme/ThemeProvider";
import iconData from "./icons/icon-data.json";

export type IconKey = keyof typeof iconData;

export type FeedbackVariant =
  | "success"
  | "warning"
  | "information"
  | "processing";

export type UtilityVariant =
  | "chevron-down"
  | "chevron-left"
  | "chevron-right"
  | "add"
  | "selection-check"
  | "transaction-expense"
  | "transaction-income"
  | "bell"
  | "scan"
  | "invoice"
  | "reports";

export type NavDestination =
  | "Home"
  | "Activity"
  | "Invoices"
  | "Documents"
  | "Libros AI"
  | "Expenses"
  | "Overview"
  | "Reports"
  | "Account";

export type NavState = "Selected" | "Default";

export interface IconProps extends SvgProps {
  name: IconKey;
  size?: number;
  color?: string;
}

interface IconPathDef {
  d: string;
  stroke?: string;
  fill?: string;
  strokeWidth?: number;
  strokeLinecap?: "butt" | "round" | "square";
  strokeLinejoin?: "miter" | "round" | "bevel";
}

export function Icon({ name, size, color, style, ...props }: IconProps) {
  const data = iconData[name];
  if (!data) return null;

  const width = size ?? data.width;
  const height = size ? (size * data.height) / data.width : data.height;

  return (
    <Svg
      width={width}
      height={height}
      viewBox={data.viewBox}
      fill="none"
      style={style}
      {...props}
    >
      {(data.paths as IconPathDef[]).map((p) => {
        const strokeColor = color ?? p.stroke;
        const fillColor = color && p.fill ? color : p.fill;
        return (
          <Path
            key={p.d}
            d={p.d}
            stroke={strokeColor}
            fill={fillColor ?? "none"}
            strokeWidth={p.strokeWidth}
            strokeLinecap={p.strokeLinecap}
            strokeLinejoin={p.strokeLinejoin}
          />
        );
      })}
    </Svg>
  );
}

export function FeedbackIcon({
  variant,
  size = 24,
  color,
  style,
  ...props
}: {
  variant: FeedbackVariant;
  size?: number;
  color?: string;
  style?: SvgProps["style"];
}) {
  const colors = useThemeColors();
  const defaultColors: Record<FeedbackVariant, string> = {
    success: colors.positive,
    warning: colors.negative,
    information: colors.primary,
    processing: colors.primary,
  };

  const resolvedColor = color ?? defaultColors[variant];
  const iconKey = `feedback/${variant}` as IconKey;

  return (
    <Icon
      name={iconKey}
      size={size}
      color={resolvedColor}
      accessibilityRole="image"
      accessibilityLabel={`Feedback ${variant}`}
      style={style}
      {...props}
    />
  );
}

export function UtilityIcon({
  name,
  size = 24,
  color,
  style,
  ...props
}: {
  name: UtilityVariant;
  size?: number;
  color?: string;
  style?: SvgProps["style"];
}) {
  const colors = useThemeColors();
  const defaultColor = name === "selection-check" ? "#FFFFFF" : colors.muted;
  const iconKey = `utility/${name}` as IconKey;

  return (
    <Icon
      name={iconKey}
      size={size}
      color={color ?? defaultColor}
      accessibilityRole="image"
      accessibilityLabel={`Utility ${name}`}
      style={style}
      {...props}
    />
  );
}

export function NavIcon({
  destination,
  state = "Default",
  size = 23,
  color,
  style,
  ...props
}: {
  destination: NavDestination;
  state?: NavState;
  size?: number;
  color?: string;
  style?: SvgProps["style"];
}) {
  const colors = useThemeColors();
  const resolvedColor =
    color ?? (state === "Selected" ? colors.primary : colors.muted);

  // Map destination to asset key
  let assetName = "";
  switch (destination) {
    case "Home":
      assetName =
        state === "Selected"
          ? "nav/owner-home-selected"
          : "nav/owner-home-default";
      break;
    case "Activity":
      assetName =
        state === "Selected"
          ? "nav/owner-activity-selected"
          : "nav/owner-activity-default";
      break;
    case "Invoices":
      assetName =
        state === "Selected"
          ? "nav/owner-invoices-selected"
          : "nav/owner-invoices-default";
      break;
    case "Documents":
      assetName =
        state === "Selected"
          ? "nav/owner-documents-selected"
          : "nav/owner-documents-default";
      break;
    case "Libros AI":
      assetName =
        state === "Selected"
          ? "nav/owner-libros-ai-selected"
          : "nav/owner-libros-ai-default";
      break;
    case "Expenses":
      assetName =
        state === "Selected"
          ? "nav/role-expenses-selected"
          : "nav/role-expenses-default";
      break;
    case "Overview":
      assetName =
        state === "Selected"
          ? "nav/role-overview-selected"
          : "nav/role-overview-default";
      break;
    case "Reports":
      assetName =
        state === "Selected"
          ? "nav/role-reports-selected"
          : "nav/role-reports-default";
      break;
    case "Account":
      assetName =
        state === "Selected"
          ? "nav/role-account-selected"
          : "nav/role-account-default";
      break;
  }

  return (
    <Icon
      name={assetName as IconKey}
      size={size}
      color={resolvedColor}
      accessibilityRole="image"
      accessibilityLabel={`${destination} navigation icon`}
      style={style}
      {...props}
    />
  );
}
