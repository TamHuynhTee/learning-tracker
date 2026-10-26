import { useQuery } from "@tanstack/react-query";
import { listResources, fetchResource } from "@/lib/resource-api";
import { useAuth } from "@/hooks/use-auth";

export function useResources() {
  const { session } = useAuth();
  const userId = session?.user.id;
  return useQuery({
    queryKey: ["resources", userId],
    queryFn: ({ signal }) => listResources(userId!, signal),
    enabled: !!userId,
  });
}

export function useResource(id: string) {
  const { session } = useAuth();
  const userId = session?.user.id;
  return useQuery({
    queryKey: ["resources", userId, id],
    queryFn: ({ signal }) => fetchResource(userId!, id, signal),
    enabled: !!userId,
  });
}
