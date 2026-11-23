import { Redirect } from "expo-router";
import { LoadingState } from "@/components/feedback/Feedback";
import { homeForRole } from "@/navigation/access";
import { useSession } from "@/providers/SessionProvider";
export default function Index() {
  const { session, loading } = useSession();
  if (loading) return <LoadingState />;
  return (
    <Redirect href={session ? homeForRole(session.role) : "/(auth)/welcome"} />
  );
}
