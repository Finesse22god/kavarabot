import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation, useRoute } from "wouter";
import { ArrowLeft, ShoppingCart, Heart, Ruler } from "lucide-react";
import { useTelegram } from "@/hooks/use-telegram";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { Box } from "@shared/schema";

export default function BoxDetail() {
  const [, params] = useRoute("/box/:id");
  const [, setLocation] = useLocation();
  const { user: telegramUser } = useTelegram();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get database user by telegram ID
  const { data: dbUser } = useQuery<{ id: string; telegramId: string; firstName?: string; lastName?: string; username?: string; loyaltyPoints: number }>({
    queryKey: [`/api/users/telegram/${telegramUser?.id}`],
    enabled: !!telegramUser?.id
  });
  
  const [selectedSize, setSelectedSize] = useState("");

  // Fetch box details
  const { data: box, isLoading, error } = useQuery<Box>({
    queryKey: [`/api/boxes/${params?.id}`],
    enabled: !!params?.id,
  });

  // Fetch box products (товары внутри бокса)
  const { data: boxProducts } = useQuery<any[]>({
    queryKey: [`/api/boxes/${params?.id}/products`],
    enabled: !!params?.id,
  });

  const addToCartMutation = useMutation({
    mutationFn: async () => {
      if (!dbUser?.id || !box) throw new Error("User or box not found");
      const data = await apiRequest("POST", "/api/cart", {
        userId: dbUser.id,
        boxId: box.id,
        selectedSize,
        itemType: "box"
      });
      return data;
    },
    onSuccess: () => {
      toast({
        title: "Добавлено в корзину",
        description: `${box?.name} добавлен в корзину`,
      });
      queryClient.invalidateQueries({ queryKey: [`/api/cart/${dbUser?.id}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/cart"] });
    },
    onError: () => {
      toast({
        title: "Ошибка",
        description: "Не удалось добавить товар в корзину",
        variant: "destructive",
      });
    },
  });

  const handleAddToCart = () => {
    if (!selectedSize) {
      toast({
        title: "Выберите размер",
        description: "Пожалуйста, выберите размер перед добавлением в корзину",
        variant: "destructive",
      });
      return;
    }
    addToCartMutation.mutate();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Загружаем информацию о боксе...</p>
        </div>
      </div>
    );
  }

  if (error || !box) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Бокс не найден</p>
          <Button onClick={() => setLocation("/catalog")}>
            Вернуться в каталог
          </Button>
        </div>
      </div>
    );
  }

  // Parse box contents - priority: real products > JSON contents > fallback
  const parseBoxContents = () => {
    // First, try to use real box products from API
    if (boxProducts && boxProducts.length > 0) {
      return boxProducts.map((boxProduct: any) => ({
        name: boxProduct.product.name,
        image: boxProduct.product.imageUrl,
        price: boxProduct.product.price,
        description: boxProduct.product.description,
        quantity: boxProduct.quantity,
        isRealProduct: true
      }));
    }
    
    // Second, try to parse JSON contents from box.contents
    if (box?.contents && Array.isArray(box.contents)) {
      return box.contents.map((item: string, index: number) => ({
        name: item,
        image: `https://images.unsplash.com/photo-${1571019613454 + index}-1cb2f99b2d8b`,
        isRealProduct: false
      }));
    }
    
    // Third, try to parse string contents
    if (box?.contents && typeof box.contents === 'string') {
      try {
        const parsed = JSON.parse(box.contents);
        if (Array.isArray(parsed)) {
          return parsed.map((item: string, index: number) => ({
            name: item,
            image: `https://images.unsplash.com/photo-${1571019613454 + index}-1cb2f99b2d8b`,
            isRealProduct: false
          }));
        }
      } catch (e) {
        // If JSON parsing fails, fallback to mock data
      }
    }
    
    // Fallback to mock data
    return [
      { name: "Спортивная футболка", image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab", isRealProduct: false },
      { name: "Леггинсы", image: "https://images.unsplash.com/photo-1506629905607-ce2a6c06f2a0", isRealProduct: false },
      { name: "Спортивный бюстгальтер", image: "https://images.unsplash.com/photo-1544966503-7cc5ac882d5e", isRealProduct: false },
      { name: "Кроссовки", image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff", isRealProduct: false }
    ];
  };

  const boxContents = parseBoxContents();

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center space-x-4">
          <button 
            className="p-2 -ml-2" 
            onClick={() => setLocation("/catalog")}
          >
            <ArrowLeft className="w-6 h-6 text-black" />
          </button>
          <div>
            <h2 className="text-2xl font-bold text-black tracking-wide">{box.name}</h2>
            <p className="text-gray-600 font-medium">
              {(typeof box.price === 'string' ? parseFloat(box.price) : box.price).toLocaleString()}₽
            </p>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-8">
        {/* Box Image and Info */}
        <div className="space-y-4">
          <img
            src={box.imageUrl || "/placeholder-box.jpg"}
            alt={box.name}
            className="w-full h-64 object-cover rounded-lg"
          />
          <div>
            <h3 className="text-xl font-bold text-black mb-2">{box.name}</h3>
            <p className="text-gray-600 mb-4">{box.description}</p>
            <p className="text-2xl font-bold text-black">{(typeof box.price === 'string' ? parseFloat(box.price) : box.price).toLocaleString()}₽</p>
          </div>
        </div>

        {/* Box Contents */}
        <div>
          <h4 className="text-lg font-bold text-black mb-4">Что внутри бокса:</h4>
          <div className="grid grid-cols-1 gap-3">
            {boxContents.map((item: any, index: number) => (
              <div key={index} className="bg-gray-50 rounded-xl p-4 flex items-center space-x-4">
                <img 
                  src={item.image} 
                  alt={item.name}
                  className="w-16 h-16 rounded-lg object-cover"
                />
                <div className="flex-1">
                  <h5 className="font-medium text-gray-900">{item.name}</h5>
                  {item.description && (
                    <p className="text-sm text-gray-600">{item.description}</p>
                  )}
                  <div className="flex items-center justify-between mt-2">
                    {item.price && (
                      <span className="text-sm font-medium text-primary">{item.price}₽</span>
                    )}
                    {item.quantity && (
                      <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                        x{item.quantity}
                      </span>
                    )}
                    {item.isRealProduct && (
                      <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                        Настоящий товар
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
          {boxContents.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <p>Содержимое бокса не определено</p>
            </div>
          )}
        </div>

        {/* Size Selection with Tabs - same as product-detail.tsx */}
        <div className="bg-gray-50 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-black">ВЫБЕРИТЕ РАЗМЕР</h3>
          </div>
          
          <div className="space-y-2">
            <div className="grid grid-cols-6 gap-2">
              {["XS", "S", "M", "L", "XL", "XXL"].map((size) => {
                const isSelected = selectedSize === size;
                return (
                  <button
                    key={size}
                    onClick={() => setSelectedSize(size)}
                    className={`
                      border-2 rounded-lg py-3 font-bold transition-colors
                      ${isSelected 
                        ? 'border-black bg-black text-white' 
                        : 'border-gray-300 bg-white text-black hover:border-gray-400'
                      }
                    `}
                    data-testid={`button-size-${size.toLowerCase()}`}
                  >
                    {size}
                  </button>
                );
              })}
            </div>
            
            {selectedSize && (
              <div className="text-sm text-green-600 font-medium mt-3">
                ✓ Размер {selectedSize} выбран
              </div>
            )}
            
            {!selectedSize && (
              <div className="text-sm text-orange-600 mt-2">
                ⚠️ Выберите размер для добавления в корзину
              </div>
            )}
          </div>

          {/* Size Chart - Always visible */}
          <div className="border-t border-gray-200 pt-4">
            <h5 className="font-semibold mb-3">Размерная сетка KAVARA</h5>
            <div className="overflow-x-auto">
              <div className="space-y-2 text-sm min-w-max">
                <div className="grid grid-cols-4 gap-4 font-semibold border-b pb-2">
                  <span>Размер</span>
                  <span>Грудь (см)</span>
                  <span>Талия (см)</span>
                  <span>Бедра (см)</span>
                </div>
                <div className="grid grid-cols-4 gap-4">
                  <span className="font-medium">XS</span><span>82-86</span><span>62-66</span><span>88-92</span>
                </div>
                <div className="grid grid-cols-4 gap-4">
                  <span className="font-medium">S</span><span>86-90</span><span>66-70</span><span>92-96</span>
                </div>
                <div className="grid grid-cols-4 gap-4">
                  <span className="font-medium">M</span><span>90-94</span><span>70-74</span><span>96-100</span>
                </div>
                <div className="grid grid-cols-4 gap-4">
                  <span className="font-medium">L</span><span>94-98</span><span>74-78</span><span>100-104</span>
                </div>
                <div className="grid grid-cols-4 gap-4">
                  <span className="font-medium">XL</span><span>98-102</span><span>78-82</span><span>104-108</span>
                </div>
                <div className="grid grid-cols-4 gap-4">
                  <span className="font-medium">XXL</span><span>102-106</span><span>82-86</span><span>108-112</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Add to Cart Button */}
        <div className="pb-20">
          <Button
            onClick={handleAddToCart}
            disabled={!selectedSize || addToCartMutation.isPending}
            className="w-full h-12 bg-black text-white hover:bg-gray-800 rounded-xl"
          >
            {addToCartMutation.isPending ? "Добавляем..." : "Добавить в корзину"}
          </Button>
        </div>
      </div>
    </div>
  );
}