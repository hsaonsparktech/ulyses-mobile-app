import { QueryClient } from "@tanstack/react-query";
import { ApiError } from "@/lib/api/client";
export function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30000,
        retry: (count, error) =>
          count < 2 &&
          !(
            error instanceof ApiError &&
            (error.canceled ||
              (error.status !== undefined && error.status < 500))
          ),
      },
      mutations: { retry: false },
    },
  });
}
export const queryClient = createQueryClient();
export async function resetRemoteState() {
  await queryClient.cancelQueries();
  queryClient.clear();
}
