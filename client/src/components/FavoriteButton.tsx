import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useIsFavorite, useFavoriteMutations } from "@/hooks/use-favorites";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface FavoriteButtonProps {
  boxId: string; // Can be either box ID or product ID
  userId?: string;
  size?: "sm" | "md" | "lg";
  variant?: "ghost" | "outline" | "default";
  className?: string;
}

export function FavoriteButton({
  boxId,
  userId,
  size = "md",
  variant = "ghost",
  className,
}: FavoriteButtonProps) {
  const { toast } = useToast();
  const { data: favoriteStatus } = useIsFavorite(userId, boxId);
  const { toggleFavorite, isLoading } = useFavoriteMutations(userId);
  
  const isFavorited = favoriteStatus?.isFavorite || false;

  const handleToggleFavorite = async () => {
    if (!userId) {
      toast({
        title: "Войдите в аккаунт",
        description: "Для добавления в избранное необходимо войти в аккаунт",
        variant: "destructive",
      });
      return;
    }

    try {
      await toggleFavorite(boxId, isFavorited);
      
      toast({
        title: isFavorited ? "Удалено из избранного" : "Добавлено в избранное",
        description: isFavorited 
          ? "Товар удален из вашего списка избранного" 
          : "Товар добавлен в ваш список избранного",
      });
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось обновить избранное. Попробуйте еще раз.",
        variant: "destructive",
      });
    }
  };

  const sizeClasses = {
    sm: "h-8 w-8",
    md: "h-10 w-10",
    lg: "h-12 w-12",
  };

  const iconSizes = {
    sm: 16,
    md: 20,
    lg: 24,
  };

  return (
    <Button
      variant={variant}
      size="icon"
      onClick={handleToggleFavorite}
      disabled={isLoading}
      className={cn(
        sizeClasses[size],
        "rounded-full transition-colors",
        isFavorited 
          ? "text-red-500 hover:text-red-600" 
          : "text-gray-400 hover:text-red-500",
        className
      )}
      data-testid={`button-favorite-${boxId}`}
    >
      <Heart
        size={iconSizes[size]}
        className={cn(
          "transition-all",
          isFavorited ? "fill-current" : "fill-none"
        )}
      />
    </Button>
  );
}