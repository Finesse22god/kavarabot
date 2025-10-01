import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
// Updated favorite hook

// Hook to check if an item is favorited
export function useIsFavorite(userId: string | undefined, boxId?: string, productId?: string) {
  return useQuery({
    queryKey: ["favorites", "check", userId, boxId, productId],
    queryFn: async () => {
      if (!userId) return { isFavorite: false };
      
      const params = new URLSearchParams({ userId });
      if (boxId) params.append('boxId', boxId);
      if (productId) params.append('productId', productId);
      
      return await apiRequest("GET", `/api/favorites/check?${params.toString()}`);
    },
    enabled: !!userId && (!!boxId || !!productId),
  });
}

// Hook to get user's favorites
export function useUserFavorites(userId: string | undefined) {
  return useQuery({
    queryKey: ["favorites", "user", userId],
    queryFn: async () => {
      if (!userId) return [];
      
      return await apiRequest("GET", `/api/users/${userId}/favorites`);
    },
    enabled: !!userId,
  });
}

// Hook to add/remove favorites
export function useFavoriteMutations(userId: string | undefined) {
  const queryClient = useQueryClient();

  const addFavorite = useMutation({
    mutationFn: async ({ boxId, productId }: { boxId?: string; productId?: string }) => {
      if (!userId) throw new Error("User ID is required");
      
      return await apiRequest("POST", "/api/favorites", { userId, boxId, productId });
    },
    onSuccess: () => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ["favorites"] });
    },
  });

  const removeFavorite = useMutation({
    mutationFn: async ({ boxId, productId }: { boxId?: string; productId?: string }) => {
      if (!userId) throw new Error("User ID is required");
      
      return await apiRequest("DELETE", "/api/favorites", { userId, boxId, productId });
    },
    onSuccess: () => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ["favorites"] });
    },
  });

  const toggleFavorite = async (boxId: string | undefined, productId: string | undefined, currentlyFavorited: boolean) => {
    if (currentlyFavorited) {
      await removeFavorite.mutateAsync({ boxId, productId });
    } else {
      await addFavorite.mutateAsync({ boxId, productId });
    }
  };

  return {
    addFavorite,
    removeFavorite,
    toggleFavorite,
    isLoading: addFavorite.isPending || removeFavorite.isPending,
  };
}