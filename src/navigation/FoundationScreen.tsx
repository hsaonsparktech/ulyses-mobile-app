import { useState } from "react";
import { EmptyState, ErrorState } from "@/components/feedback/Feedback";
import { Screen } from "@/components/layout/Screen";
import { Button } from "@/components/ui/Button";
import { LibrosLogo } from "@/components/ui/LibrosLogo";
import { Text } from "@/components/ui/Text";
import { useSession } from "@/providers/SessionProvider";
export function FoundationScreen({ title }: { title: string }) {
  const { signOut } = useSession();
  const [error, setError] = useState(false);
  return (
    <Screen>
      <LibrosLogo variant="compact" width={64} />
      <Text variant="Title">{title}</Text>
      <EmptyState message="Navigation foundation only. No business data is connected." />
      {error ? (
        <ErrorState message="Credential cleanup failed. Restart and try again." />
      ) : null}
      <Button
        title="Sign out"
        onPress={() => {
          signOut().catch(() => setError(true));
        }}
      />
    </Screen>
  );
}
