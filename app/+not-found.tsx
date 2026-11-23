import { Link } from "expo-router";
import { Screen } from "@/components/layout/Screen";
import { Text } from "@/components/ui/Text";
export default function NotFound() {
  return (
    <Screen>
      <Text>Page not found.</Text>
      <Link href="/">
        <Text>Return to entry</Text>
      </Link>
    </Screen>
  );
}
