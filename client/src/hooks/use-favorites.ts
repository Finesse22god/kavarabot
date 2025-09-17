import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
// Updated favorite hook

// Hook to check if an item is favorited
export function useIsFavorite(userId: string | undefined, boxId: string) {
  return useQuery({
    queryKey: ["favorites", "check", userId, boxId],
    queryFn: async () => {
      if (!userId) return { isFavorite: false };
      
      const response = await fetch(`/api/favorites/check?userId=${userId}&boxId=${boxId}`);
      if (!response.ok) throw new Error("Failed to check favorite status");
      return response.json();
    },
    enabled: !!userId && !!boxId,
  });
}

// Hook to get user's favorites
export function useUserFavorites(userId: string | undefined) {
  return useQuery({
    queryKey: ["favorites", "user", userId],
    queryFn: async () => {
      if (!userId) return [];
      
      const response = await fetch(`/api/users/${userId}/favorites`);
      if (!response.ok) throw new Error("Failed to fetch favorites");
      return await response.json();
    },
    enabled: !!userId,
  });
}

// Hook to add/remove favorites
export function useFavoriteMutations(userId: string | undefined) {
  const queryClient = useQueryClient();

  const addFavorite = useMutation({
    mutationFn: async (boxId: string) => {
      if (!userId) throw new Error("User ID is required");
      
      const response = await fetch("/api/favorites", {
        method: "POST",
        body: JSON.stringify({ userId, boxId }),
        headers: { "Content-Type": "application/json" },
      });
      if (!response.ok) throw new Error("Failed to add favorite");
      return await response.json();
    },
    onSuccess: (_, boxId) => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ["favorites", "check", userId, boxId] });
      queryClient.invalidateQueries({ queryKey: ["favorites", "user", userId] });
    },
  });

  const removeFavorite = useMutation({
    mutationFn: async (boxId: string) => {
      if (!userId) throw new Error("User ID is required");
      
      const response = await fetch("/api/favorites", {
        method: "DELETE",
        body: JSON.stringify({ userId, boxId }),
        headers: { "Content-Type": "application/json" },
      });
      if (!response.ok) throw new Error("Failed to remove favorite");
      return await response.json();
    },
    onSuccess: (_, boxId) => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ["favorites", "check", userId, boxId] });
      queryClient.invalidateQueries({ queryKey: ["favorites", "user", userId] });
    },
  });

  const toggleFavorite = async (boxId: string, currentlyFavorited: boolean) => {
    if (currentlyFavorited) {
      await removeFavorite.mutateAsync(boxId);
    } else {
      await addFavorite.mutateAsync(boxId);
    }
  };

  return {
    addFavorite,
    removeFavorite,
    toggleFavorite,
    isLoading: addFavorite.isPending || removeFavorite.isPending,
  };
}