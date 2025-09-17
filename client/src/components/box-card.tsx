import { useState } from "react";
import { Heart, Star, ShoppingCart, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import type { Box } from "@shared/schema";

interface BoxCardProps {
  box: Box;
  onSelect?: (box: Box) => void;
  onNotify?: (box: Box) => void;
  variant?: "default" | "coming-soon";
  userId?: string;
}

export default function BoxCard({ 
  box, 
  onSelect, 
  onNotify, 
  variant = "default",
  userId 
}: BoxCardProps) {
  const [isFavorited, setIsFavorited] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const favoriteMutation = useMutation({
    mutationFn: async (isFav: boolean) => {
      const method = isFav ? "POST" : "DELETE";
      const response = await fetch("/api/favorites", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, boxId: box.id }),
      });
      if (!response.ok) throw new Error("Failed to update favorite");
      return response.json();
    },
    onSuccess: (_, isFav) => {
      setIsFavorited(isFav);
      queryClient.invalidateQueries({ queryKey: [`/api/favorites/${userId}`] });
      toast({
        title: isFav ? "Добавлено в избранное" : "Удалено из избранного",
        description: isFav ? "Товар добавлен в избранное" : "Товар удален из избранного",
      });
    },
    onError: () => {
      toast({
        title: "Ошибка",
        description: "Не удалось обновить избранное",
        variant: "destructive",
      });
    },
  });

  const handleFavoriteToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!userId) {
      toast({
        title: "Требуется авторизация",
        description: "Для добавления в избранное нужно войти в систему",
        variant: "destructive",
      });
      return;
    }
    favoriteMutation.mutate(!isFavorited);
  };

  const handleSelect = () => {
    if (onSelect && variant !== "coming-soon") {
      onSelect(box);
    }
  };

  const handleNotify = () => {
    if (onNotify) {
      onNotify(box);
    }
  };

  const isComingSoon = variant === "coming-soon" || !box.isAvailable;

  return (
    <div className={`bg-white rounded-xl shadow-lg overflow-hidden transition-all duration-300 ${
      !isComingSoon ? 'hover:shadow-xl cursor-pointer' : 'opacity-75'
    }`}>
      <div className="relative">
        <img 
          src={box.imageUrl || "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b"} 
          alt={box.name}
          className="w-full h-48 object-cover"
          onClick={handleSelect}
        />
        
        {/* Favorite Button */}
        <button
          onClick={handleFavoriteToggle}
          disabled={favoriteMutation.isPending}
          className="absolute top-3 right-3 p-2 bg-white/80 backdrop-blur-sm rounded-full shadow-md hover:bg-white transition-all"
        >
          <Heart 
            className={`w-5 h-5 ${
              isFavorited ? 'fill-red-500 text-red-500' : 'text-gray-600'
            }`} 
          />
        </button>

        {/* Coming Soon Badge */}
        {isComingSoon && (
          <div className="absolute top-3 left-3">
            <Badge variant="secondary" className="bg-orange-100 text-orange-800">
              Скоро в продаже
            </Badge>
          </div>
        )}

        {/* Discount Badge */}
        {box.originalPrice && Number(box.originalPrice) > Number(box.price) && (
          <div className="absolute bottom-3 left-3">
            <Badge variant="destructive" className="bg-red-500 text-white">
              -{Math.round(((Number(box.originalPrice) - Number(box.price)) / Number(box.originalPrice)) * 100)}%
            </Badge>
          </div>
        )}
      </div>

      <div className="p-6" onClick={handleSelect}>
        <div className="flex justify-between items-start mb-3">
          <div className="flex-1">
            <h3 className="text-lg font-bold text-black mb-1 line-clamp-2">
              {box.name}
            </h3>
            <p className="text-gray-600 text-sm line-clamp-2">
              {box.description}
            </p>
          </div>
        </div>

        {/* Contents Preview */}
        {box.contents && Array.isArray(box.contents) && box.contents.length > 0 && (
          <div className="mb-4">
            <div className="flex flex-wrap gap-1">
              {box.contents.slice(0, 3).map((item: any, index: number) => (
                <Badge key={index} variant="outline" className="text-xs">
                  {typeof item === 'string' ? item : JSON.stringify(item)}
                </Badge>
              ))}
              {box.contents.length > 3 && (
                <Badge variant="outline" className="text-xs">
                  +{box.contents.length - 3} товара
                </Badge>
              )}
            </div>
          </div>
        )}

        {/* Sizes */}
        {box.availableSizes && box.availableSizes.length > 0 && (
          <div className="mb-4">
            <p className="text-sm text-gray-600 mb-2">Доступные размеры:</p>
            <div className="flex flex-wrap gap-1">
              {box.availableSizes.map((size: string, index: number) => (
                <Badge key={index} variant="outline" className="text-xs">
                  {size}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Rating */}
        {box.rating && (
          <div className="flex items-center mb-3">
            <div className="flex items-center">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`w-4 h-4 ${
                    i < Math.floor(Number(box.rating) || 0)
                      ? 'fill-yellow-400 text-yellow-400'
                      : 'text-gray-300'
                  }`}
                />
              ))}
            </div>
            <span className="text-sm text-gray-600 ml-2">
              ({Number(box.rating || 0).toFixed(1)})
            </span>
          </div>
        )}

        {/* Price */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <span className="text-2xl font-bold text-black">
              {Number(box.price).toLocaleString('ru-RU')}₽
            </span>
            {box.originalPrice && box.originalPrice > box.price && (
              <span className="text-sm text-gray-500 line-through">
                {Number(box.originalPrice).toLocaleString('ru-RU')}₽
              </span>
            )}
          </div>
          {box.category && (
            <Badge variant="outline" className="text-xs">
              {box.category === 'ready' ? 'Готовый' : 
               box.category === 'personal' ? 'Персональный' : 
               box.category}
            </Badge>
          )}
        </div>

        {/* Action Button */}
        {isComingSoon ? (
          <Button 
            onClick={(e) => {
              e.stopPropagation();
              handleNotify();
            }}
            variant="outline" 
            className="w-full"
            disabled={!onNotify}
          >
            <Bell className="w-4 h-4 mr-2" />
            Уведомить о поступлении
          </Button>
        ) : (
          <Button 
            onClick={(e) => {
              e.stopPropagation();
              handleSelect();
            }}
            className="w-full bg-black text-white hover:bg-gray-800"
            disabled={!onSelect}
          >
            <ShoppingCart className="w-4 h-4 mr-2" />
            Выбрать бокс
          </Button>
        )}
      </div>
    </div>
  );
}