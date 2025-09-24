import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation, useRoute } from "wouter";
import { ArrowLeft, ShoppingCart, Heart, User, Ruler } from "lucide-react";
import { useTelegram } from "@/hooks/use-telegram";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  const [measurements, setMeasurements] = useState({
    height: "",
    weight: "",
    sleeveLength: "",
    chestSize: "",
    waistSize: "",
    hipSize: ""
  });

  // Fetch box details
  const { data: box, isLoading, error } = useQuery<Box>({
    queryKey: [`/api/boxes/${params?.id}`],
    enabled: !!params?.id,
  });

  // Fetch box products (товары внутри бокса)
  const { data: boxProducts } = useQuery({
    queryKey: [`/api/boxes/${params?.id}/products`],
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
    if (suggestedSize && !selectedSize) {
      setSelectedSize(suggestedSize);
    }
  }, [measurements.chestSize, measurements.waistSize, measurements.hipSize, selectedSize]);

  const saveMeasurements = async () => {
    if (!dbUser?.id) return;
    
    try {
      await fetch(`/api/users/measurements/${dbUser.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...measurements,
          preferredSize: selectedSize
        })
      });
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: [`/api/users/measurements/${dbUser.id}`] });
      
      toast({
        title: "Параметры сохранены",
        description: "Ваши размеры и предпочтения были сохранены",
      });
    } catch (error) {
      console.error('Error saving measurements:', error);
    }
  };

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

  // Parse box contents from description or create mock data
  const boxContents = [
    { name: "Спортивная футболка", image: "/placeholder-item1.jpg" },
    { name: "Леггинсы", image: "/placeholder-item2.jpg" },
    { name: "Спортивный бюстгальтер", image: "/placeholder-item3.jpg" },
    { name: "Кроссовки", image: "/placeholder-item4.jpg" }
  ];

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
            src={box.imageUrl}
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
          {boxProducts && boxProducts.length > 0 ? (
            <div className="grid grid-cols-1 gap-3">
              {boxProducts.map((boxProduct: any, index: number) => (
                <div key={index} className="bg-gray-50 rounded-xl p-4 flex items-center space-x-4">
                  <img 
                    src={boxProduct.product.imageUrl} 
                    alt={boxProduct.product.name}
                    className="w-16 h-16 rounded-lg object-cover"
                  />
                  <div className="flex-1">
                    <h5 className="font-medium text-gray-900">{boxProduct.product.name}</h5>
                    <p className="text-sm text-gray-600">{boxProduct.product.description}</p>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-sm font-medium text-primary">{boxProduct.product.price}₽</span>
                      <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                        x{boxProduct.quantity}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              {boxContents.map((item, index) => (
                <div key={index} className="bg-gray-50 rounded-lg p-4 text-center">
                  <div className="w-full h-20 bg-gray-200 rounded-lg mb-2 flex items-center justify-center">
                    <span className="text-gray-500 text-sm">{item.name}</span>
                  </div>
                  <p className="text-sm font-medium text-gray-700">{item.name}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Size Selection */}
        <div className="space-y-6">
          <div>
            <h5 className="font-semibold mb-3">Выберите размер:</h5>
            {getSuggestedSize(measurements.chestSize, measurements.waistSize, measurements.hipSize) && (
              <div className="mb-3 p-2 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">
                💡 Рекомендуем размер <strong>{getSuggestedSize(measurements.chestSize, measurements.waistSize, measurements.hipSize)}</strong> на основе ваших параметров
              </div>
            )}
            <div className="grid grid-cols-3 gap-3">
              {["XS", "S", "M", "L", "XL", "XXL"].map((size) => {
                const isRecommended = getSuggestedSize(measurements.chestSize, measurements.waistSize, measurements.hipSize) === size;
                return (
                  <Button
                    key={size}
                    variant={selectedSize === size ? "default" : "outline"}
                    onClick={() => setSelectedSize(size)}
                    className={`h-12 font-semibold relative ${isRecommended ? 'ring-2 ring-green-400' : ''}`}
                  >
                    {size}
                    {isRecommended && (
                      <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full"></span>
                    )}
                  </Button>
                );
              })}
            </div>
          </div>

          {/* Size Chart */}
          <div>
            <h5 className="font-semibold mb-3">Размерная сетка KAVARA</h5>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="space-y-2 text-sm">
                <div className="grid grid-cols-4 gap-2 font-semibold border-b pb-2">
                  <span>Размер</span>
                  <span>Грудь</span>
                  <span>Талия</span>
                  <span>Бедра</span>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  <span>XS</span><span>82-86</span><span>62-66</span><span>88-92</span>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  <span>S</span><span>86-90</span><span>66-70</span><span>92-96</span>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  <span>M</span><span>90-94</span><span>70-74</span><span>96-100</span>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  <span>L</span><span>94-98</span><span>74-78</span><span>100-104</span>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  <span>XL</span><span>98-102</span><span>78-82</span><span>104-108</span>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  <span>XXL</span><span>102-106</span><span>82-86</span><span>108-112</span>
                </div>
              </div>
            </div>
          </div>

          {/* My Parameters */}
          <div>
            <h5 className="font-semibold mb-3 flex items-center gap-2">
              <User className="w-4 h-4" />
              Мои параметры
            </h5>
            <div className="bg-gray-50 rounded-lg p-4 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="height" className="text-xs">Рост (см)</Label>
                  <Input
                    id="height"
                    placeholder="170"
                    value={measurements.height}
                    onChange={(e) => setMeasurements(prev => ({ ...prev, height: e.target.value }))}
                    className="h-8 text-sm"
                  />
                </div>
                <div>
                  <Label htmlFor="weight" className="text-xs">Вес (кг)</Label>
                  <Input
                    id="weight"
                    placeholder="65"
                    value={measurements.weight}
                    onChange={(e) => setMeasurements(prev => ({ ...prev, weight: e.target.value }))}
                    className="h-8 text-sm"
                  />
                </div>
                <div>
                  <Label htmlFor="chestSize" className="text-xs">Обхват груди (см)
                    <span className="text-xs text-gray-500 ml-1">💡 На выдохе</span>
                  </Label>
                  <Input
                    id="chestSize"
                    placeholder="90"
                    value={measurements.chestSize}
                    onChange={(e) => setMeasurements(prev => ({ ...prev, chestSize: e.target.value }))}
                    className="h-8 text-sm"
                  />
                </div>
                <div>
                  <Label htmlFor="waistSize" className="text-xs">Обхват талии (см)
                    <span className="text-xs text-gray-500 ml-1">💡 В самом узком месте</span>
                  </Label>
                  <Input
                    id="waistSize"
                    placeholder="70"
                    value={measurements.waistSize}
                    onChange={(e) => setMeasurements(prev => ({ ...prev, waistSize: e.target.value }))}
                    className="h-8 text-sm"
                  />
                </div>
                <div>
                  <Label htmlFor="hipSize" className="text-xs">Обхват бедер (см)
                    <span className="text-xs text-gray-500 ml-1">💡 В самом широком месте</span>
                  </Label>
                  <Input
                    id="hipSize"
                    placeholder="95"
                    value={measurements.hipSize}
                    onChange={(e) => setMeasurements(prev => ({ ...prev, hipSize: e.target.value }))}
                    className="h-8 text-sm"
                  />
                </div>
                <div>
                  <Label htmlFor="sleeveLength" className="text-xs">Длина рукава (см)
                    <span className="text-xs text-gray-500 ml-1">💡 От плеча до запястья</span>
                  </Label>
                  <Input
                    id="sleeveLength"
                    placeholder="60"
                    value={measurements.sleeveLength}
                    onChange={(e) => setMeasurements(prev => ({ ...prev, sleeveLength: e.target.value }))}
                    className="h-8 text-sm"
                  />
                </div>
              </div>
              <Button
                onClick={saveMeasurements}
                className="w-full"
                variant="outline"
                size="sm"
              >
                Сохранить параметры
              </Button>
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