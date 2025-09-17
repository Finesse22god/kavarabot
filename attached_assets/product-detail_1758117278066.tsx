import { useState, useEffect } from "react";
import { useRoute, useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Heart, ShoppingCart, User, Ruler } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useTelegram } from "@/hooks/use-telegram";
import { apiRequest } from "@/lib/queryClient";

interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  imageUrl?: string;
  category?: string;
  brand?: string;
  color?: string;
  sizes?: string[];
  isAvailable: boolean;
  sportTypes?: string[];
}

export default function ProductDetail() {
  const [, params] = useRoute("/product/:id");
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
  const [measurements, setMeasurements] = useState({
    height: "",
    weight: "",
    sleeveLength: "",
    chestSize: "",
    waistSize: "",
    hipSize: ""
  });

  // Fetch product details
  const { data: product, isLoading, error } = useQuery<Product>({
    queryKey: [`/api/products/${params?.id}`],
    enabled: !!params?.id,
  });

  // Fetch existing user measurements
  const { data: existingMeasurements } = useQuery({
    queryKey: [`/api/users/measurements/${dbUser?.id}`],
    enabled: !!dbUser?.id,
    retry: 1,
  });

  // Auto size recommendation based on measurements
  const getSuggestedSize = (chest: string, waist: string, hip: string) => {
    if (!chest || !waist || !hip) return null;
    
    const chestNum = parseInt(chest);
    const waistNum = parseInt(waist);
    const hipNum = parseInt(hip);
    
    if (isNaN(chestNum) || isNaN(waistNum) || isNaN(hipNum)) return null;
    
    // Size chart logic
    if (chestNum <= 86 && waistNum <= 66 && hipNum <= 92) return "XS";
    if (chestNum <= 90 && waistNum <= 70 && hipNum <= 96) return "S";
    if (chestNum <= 94 && waistNum <= 74 && hipNum <= 100) return "M";
    if (chestNum <= 98 && waistNum <= 78 && hipNum <= 104) return "L";
    if (chestNum <= 102 && waistNum <= 82 && hipNum <= 108) return "XL";
    return "XXL";
  };

  // Load existing measurements when they're fetched
  useEffect(() => {
    if (existingMeasurements) {
      setMeasurements({
        height: existingMeasurements.height || "",
        weight: existingMeasurements.weight || "",
        sleeveLength: existingMeasurements.sleeveLength || "",
        chestSize: existingMeasurements.chestSize || "",
        waistSize: existingMeasurements.waistSize || "",
        hipSize: existingMeasurements.hipSize || ""
      });
      if (existingMeasurements.preferredSize) {
        setSelectedSize(existingMeasurements.preferredSize);
      }
    }
  }, [existingMeasurements]);

  // Auto-select size when measurements change
  useEffect(() => {
    const suggestedSize = getSuggestedSize(measurements.chestSize, measurements.waistSize, measurements.hipSize);
    if (suggestedSize && !selectedSize && product?.sizes?.includes(suggestedSize)) {
      setSelectedSize(suggestedSize);
    }
  }, [measurements.chestSize, measurements.waistSize, measurements.hipSize, selectedSize, product?.sizes]);

  const addToCartMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          userId: dbUser?.id, 
          productId: product?.id, 
          quantity: 1,
          selectedSize,
          itemType: "product"
        }),
      });
      if (!response.ok) throw new Error("Failed to add to cart");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/cart/${dbUser?.id}`] });
      toast({
        title: "Добавлено в корзину",
        description: "Товар успешно добавлен в корзину",
      });
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
          <div className="animate-spin w-8 h-8 border-4 border-black border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Загружаем товар...</p>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-black mb-4">Товар не найден</h2>
          <p className="text-gray-600 mb-6">Произошла ошибка при загрузке товара</p>
          <Button onClick={() => setLocation("/catalog")} className="bg-black text-white">
            Вернуться к каталогу
          </Button>
        </div>
      </div>
    );
  }

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
            <h2 className="text-2xl font-bold text-black tracking-wide">{product.name}</h2>
            <p className="text-gray-600 font-medium">
              {product.price.toLocaleString()}₽
            </p>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-8">
        {/* Product Image and Info */}
        <div className="space-y-4">
          <img
            src={product.imageUrl}
            alt={product.name}
            className="w-full h-64 object-cover rounded-lg"
          />
          <div>
            <h3 className="text-xl font-bold text-black mb-2">{product.name}</h3>
            <p className="text-gray-600 mb-4">{product.description}</p>
            <p className="text-2xl font-bold text-black">{product.price.toLocaleString()}₽</p>
          </div>
        </div>

        {/* Product Details */}
        {(product.brand || product.color || product.category) && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Детали товара</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {product.brand && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Бренд:</span>
                  <span className="font-medium">{product.brand}</span>
                </div>
              )}
              {product.color && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Цвет:</span>
                  <span className="font-medium">{product.color}</span>
                </div>
              )}
              {product.category && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Категория:</span>
                  <span className="font-medium">{product.category}</span>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Size Selection */}
        {product.sizes && product.sizes.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center space-x-2">
                <Ruler className="w-5 h-5" />
                <span>Выбор размера</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="size-select" className="text-sm font-medium">
                  Доступные размеры
                </Label>
                <Select value={selectedSize} onValueChange={setSelectedSize}>
                  <SelectTrigger>
                    <SelectValue placeholder="Выберите размер" />
                  </SelectTrigger>
                  <SelectContent>
                    {product.sizes.map((size) => (
                      <SelectItem key={size} value={size}>
                        {size}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {/* Size recommendation */}
              {measurements.chestSize && measurements.waistSize && measurements.hipSize && (
                <div className="p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <strong>Рекомендация:</strong> На основе ваших измерений рекомендуемый размер: {" "}
                    <span className="font-bold">
                      {getSuggestedSize(measurements.chestSize, measurements.waistSize, measurements.hipSize)}
                    </span>
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Add to Cart Button */}
        <div className="sticky bottom-0 bg-white border-t border-gray-200 p-6 -mx-6">
          <Button
            onClick={handleAddToCart}
            disabled={addToCartMutation.isPending || !selectedSize}
            className="w-full bg-black text-white hover:bg-gray-800 py-4 text-lg font-semibold tracking-wide"
          >
            {addToCartMutation.isPending ? (
              <div className="flex items-center space-x-2">
                <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                <span>Добавляем...</span>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <ShoppingCart className="w-5 h-5" />
                <span>ДОБАВИТЬ В КОРЗИНУ</span>
              </div>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}