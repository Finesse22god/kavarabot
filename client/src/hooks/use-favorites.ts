import { useQuery } from "@tanstack/react-query";

interface Favorite {
  id: string;
  userId: string;
  boxId: string;
  box: any; // Box object
  createdAt: string;
}

export function useUserFavorites(userId?: string) {
  return useQuery<Favorite[]>({
    queryKey: [`/api/favorites/${userId}`],
    queryFn: async () => {
      if (!userId) return [];
      const response = await fetch(`/api/favorites/${userId}`);
      if (!response.ok) {
        if (response.status === 404) return [];
        throw new Error("Failed to fetch favorites");
      }
      return response.json();
    },
    enabled: !!userId,
  });
}