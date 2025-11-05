import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Package } from "lucide-react";
import BoxCard from "@/components/box-card";
import CatalogHeader from "@/components/catalog-header";
import { useTelegram } from "@/hooks/use-telegram";
import { useToast } from "@/hooks/use-toast";

export default function Boxes() {
  const [, setLocation] = useLocation();
  const { user: telegramUser } = useTelegram();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get database user by telegram ID
  const { data: dbUser } = useQuery<{ id: string; telegramId: string; firstName?: string; lastName?: string; username?: string; loyaltyPoints: number }>({
    queryKey: [`/api/users/telegram/${telegramUser?.id}`],
    enabled: !!telegramUser?.id
  });

  // Fetch all boxes
  const { data: boxes, isLoading, error } = useQuery({
    queryKey: ["/api/boxes"],
  });

  const handleSelectBox = (box: any) => {
    sessionStorage.setItem("selectedBox", JSON.stringify(box));
    setLocation("/order");
  };

  // Add to cart mutation
  const addToCartMutation = useMutation({
    mutationFn: async ({ userId, boxId, quantity, selectedSize, itemType }: {
      userId: string;
      boxId: string;
      quantity: number;
      selectedSize?: string;
      itemType: string;
    }) => {
      const response = await fetch("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          productId: boxId,
          quantity,
          selectedSize,
          itemType,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to add to cart");
      }
      
      return response.json();
    },
    onSuccess: (data, variables) => {
      toast({
        title: "✓ Добавлено в корзину",
        description: `Бокс ${variables.selectedSize ? `(размер ${variables.selectedSize})` : ""} добавлен в корзину`,
      });
      queryClient.invalidateQueries({ queryKey: [`/api/cart/${dbUser?.id}`] });
    },
    onError: (error: Error) => {
      toast({
        title: "Ошибка",
        description: error.message || "Не удалось добавить бокс в корзину",
        variant: "destructive",
      });
    },
  });

  const handleAddToCart = (box: any, selectedSize?: string) => {
    if (!dbUser?.id) {
      toast({
        title: "Ошибка авторизации",
        description: "Необходимо войти в систему для добавления товаров в корзину",
        variant: "destructive",
      });
      return;
    }

    if (!selectedSize) {
      toast({
        title: "Выберите размер",
        description: "Пожалуйста, выберите размер перед добавлением в корзину",
        variant: "destructive",
      });
      return;
    }

    addToCartMutation.mutate({
      userId: dbUser.id,
      boxId: box.id,
      quantity: 1,
      selectedSize: selectedSize,
      itemType: "box"
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-white border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-white">Загружаем боксы...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center text-white">
          <p>Ошибка загрузки боксов</p>
          <p className="text-sm text-gray-400">{String(error)}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black pb-32">
      {/* Header */}
      <CatalogHeader activeTab="boxes" />

      {/* Boxes Grid */}
      <div className="p-4">
        {boxes && (boxes as any[]).length > 0 ? (
          <div className="grid grid-cols-1 gap-4 mb-4">
            {(boxes as any[]).map((box: any, index: number) => (
              <BoxCard 
                key={box.id}
                box={box}
                userId={dbUser?.id}
                onSelect={handleSelectBox}
                onAddToCart={handleAddToCart}
                index={index}
                data-testid={`box-card-${box.id}`}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Боксы скоро появятся
            </h3>
            <p className="text-gray-600 mb-6">
              Мы работаем над созданием готовых комплектов для вас
            </p>
          </div>
        )}
      </div>
    </div>
  );
}