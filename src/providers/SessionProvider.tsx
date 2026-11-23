import {
  createContext,
  type PropsWithChildren,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { env } from "@/config/env";
import { createHttpAuth, unavailableAuth } from "@/features/auth/api/adapter";
import type { Session, SignInInput } from "@/features/auth/schemas/session";
import { resetRemoteState } from "@/lib/query/client";
import { credentials } from "@/lib/storage/credentials";
import { useUiStore } from "@/stores/ui";

type State = {
  session: Session | null;
  loading: boolean;
  error: string | null;
  signIn: (input: SignInInput) => Promise<void>;
  signOut: () => Promise<void>;
};
const Context = createContext<State | null>(null);
export function SessionProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const request = useRef<AbortController | null>(null);
  const epoch = useRef(0);
  useEffect(() => {
    const controller = new AbortController();
    request.current = controller;
    const adapter = env.mockAuth
      ? unavailableAuth
      : createHttpAuth(env.apiBaseUrl);

    adapter
      .restore(controller.signal)
      .then((restored) => {
        if (!controller.signal.aborted) setSession(restored);
      })
      .catch(() => {
        if (!controller.signal.aborted) {
          setError("Session recovery failed. Please sign in again.");
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => {
      controller.abort();
      epoch.current++;
    };
  }, []);
  async function signIn(input: SignInInput) {
    const version = ++epoch.current;
    request.current?.abort();
    const controller = new AbortController();
    request.current = controller;
    const adapter = env.mockAuth
      ? (await import("@/mocks/auth-adapter")).createMockAuth(
          useUiStore.getState().previewRole,
        )
      : createHttpAuth(env.apiBaseUrl);
    const next = await adapter.signIn(input, controller.signal);
    await resetRemoteState();
    if (version === epoch.current && !controller.signal.aborted) {
      setError(null);
      setSession(next);
    }
  }
  async function signOut() {
    ++epoch.current;
    request.current?.abort();
    setSession(null);
    await resetRemoteState();
    await credentials.clear();
    const adapter = env.mockAuth
      ? unavailableAuth
      : createHttpAuth(env.apiBaseUrl);
    await adapter.signOut();
  }
  return (
    <Context.Provider value={{ session, loading, error, signIn, signOut }}>
      {children}
    </Context.Provider>
  );
}
export function useSession() {
  const value = useContext(Context);
  if (!value) throw new Error("SessionProvider is required.");
  return value;
}
