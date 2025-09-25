import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { ArrowLeft, Filter, ShoppingCart, X, User, Ruler } from "lucide-react";
import { useTelegram } from "@/hooks/use-telegram";
import BoxCard from "@/components/box-card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { Box } from "@shared/schema";

const SPORT_TYPES = [
  "Все виды спорта",
  "Бег/кардио",
  "Силовые тренировки", 
  "Йога/пилатес",
  "Велоспорт",
  "Командные виды спорта",
  "Повседневная носка"
];

const CATEGORIES = [
  "Все категории",
  "Рашгарды",
  "Лосины", 
  "Рубашки",
  "Поло",
  "Шорты",
  "Футболки",
  "Майки",
  "Худи",
  "Брюки",
  "Жилеты",
  "Олимпийки",
  "Джемперы",
  "Куртки",
  "Свитшоты",
  "Сумки",
  "Аксессуары"
];

const PRICE_RANGES = [
  { label: "Все цены", min: 0, max: Infinity },
  { label: "До 5.000₽", min: 0, max: 5000 },
  { label: "5.000 - 10.000₽", min: 5000, max: 10000 },
  { label: "10.000 - 15.000₽", min: 10000, max: 15000 },
  { label: "15.000 - 20.000₽", min: 15000, max: 20000 },
  { label: "Свыше 20.000₽", min: 20000, max: Infinity }
];

export default function Catalog() {
  const [, setLocation] = useLocation();
  const { user: telegramUser } = useTelegram();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get database user by telegram ID
  const { data: dbUser } = useQuery<{ id: string; telegramId: string; firstName?: string; lastName?: string; username?: string; loyaltyPoints: number }>({
    queryKey: [`/api/users/telegram/${telegramUser?.id}`],
    enabled: !!telegramUser?.id
  });
  const [selectedSportType, setSelectedSportType] = useState("Все виды спорта");
  const [selectedCategory, setSelectedCategory] = useState("Все категории");
  const [selectedPriceRange, setSelectedPriceRange] = useState(PRICE_RANGES[0]);
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [selectedBoxForSize, setSelectedBoxForSize] = useState<Box | null>(null);
  const [selectedSize, setSelectedSize] = useState("");
  const [measurements, setMeasurements] = useState({
    height: "",
    weight: "",
    sleeveLength: "",
    chestSize: "",
    waistSize: "",
    hipSize: ""
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
    if (existingMeasurements && typeof existingMeasurements === 'object') {
      setMeasurements({
        height: (existingMeasurements as any).height || "",
        weight: (existingMeasurements as any).weight || "",
        sleeveLength: (existingMeasurements as any).sleeveLength || "",
        chestSize: (existingMeasurements as any).chestSize || "",
        waistSize: (existingMeasurements as any).waistSize || "",
        hipSize: (existingMeasurements as any).hipSize || ""
      });
      if ((existingMeasurements as any).preferredSize) {
        setSelectedSize((existingMeasurements as any).preferredSize);
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

  // This functionality is now handled by the useQuery for existingMeasurements above

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

  const { data: catalogItems, isLoading, error } = useQuery({
    queryKey: ["/api/catalog", selectedCategory, selectedSportType, selectedPriceRange],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (selectedCategory && selectedCategory !== "Все категории") {
        params.append("category", selectedCategory);
      }
      if (selectedSportType && selectedSportType !== "Все виды спорта") {
        params.append("sportType", selectedSportType);
      }
      if (selectedPriceRange.min > 0) {
        params.append("minPrice", selectedPriceRange.min.toString());
      }
      if (selectedPriceRange.max < Infinity) {
        params.append("maxPrice", selectedPriceRange.max.toString());
      }
      
      const response = await fetch(`/api/catalog?${params.toString()}`);
      if (!response.ok) throw new Error("Failed to fetch catalog");
      return response.json() as Promise<Box[]>;
    },
  });

  // Fetch ready boxes для отображения наверху
  const { data: readyBoxes } = useQuery({
    queryKey: ["/api/boxes"],
    queryFn: async () => {
      const response = await fetch("/api/boxes");
      if (!response.ok) throw new Error("Failed to fetch boxes");
      const allBoxes = await response.json() as Box[];
      // Фильтруем только готовые боксы (category: "ready")
      return allBoxes.filter(box => 
        box.contents && 
        Array.isArray(box.contents) && 
        box.contents.length > 0 &&
        box.category === "ready"
      );
    },
  });

  const addToCartMutation = useMutation({
    mutationFn: async ({ itemId, selectedSize, itemType }: { itemId: string; selectedSize: string; itemType: string }) => {
      const requestBody = {
        userId: dbUser?.id,
        quantity: 1,
        selectedSize,
        itemType,
        ...(itemType === "product" ? { productId: itemId } : { boxId: itemId })
      };
      
      const response = await fetch("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });
      if (!response.ok) throw new Error("Failed to add to cart");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/cart/${dbUser?.id}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/cart"] });
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

  const handleSelectBox = (box: Box) => {
    setSelectedBoxForSize(box);
  };

  const handleAddToCart = (box: Box) => {
    if (!dbUser?.id) {
      toast({
        title: "Требуется авторизация",
        description: "Войдите в систему для добавления товаров в корзину",
        variant: "destructive",
      });
      return;
    }
    
    // Открываем модал выбора размера
    setSelectedBoxForSize(box);
    setSelectedSize("");
  };

  const confirmAddToCart = () => {
    if (!selectedSize || !selectedBoxForSize) {
      toast({
        title: "Выберите размер",
        description: "Пожалуйста, выберите размер перед добавлением в корзину",
        variant: "destructive",
      });
      return;
    }

    // Determine item type: if it has sizes array, it's a product; otherwise it's a box
    const itemType = (selectedBoxForSize as any).sizes ? "product" : "box";
    addToCartMutation.mutate({ itemId: selectedBoxForSize.id, selectedSize, itemType });
    setSelectedBoxForSize(null);
    setSelectedSize("");
  };

  // Фильтрация товаров
  const filteredItems = catalogItems?.filter(item => {
    // Фильтр по виду спорта
    const sportMatch = selectedSportType === "Все виды спорта" || 
      (item.sportTypes && item.sportTypes.includes(selectedSportType));
    
    // Фильтр по категории
    const categoryMatch = selectedCategory === "Все категории" || 
      ((item as any).category === selectedCategory);
    
    // Фильтр по цене
    const itemPrice = typeof item.price === 'string' ? parseFloat(item.price) : item.price;
    const priceMatch = itemPrice >= selectedPriceRange.min && itemPrice <= selectedPriceRange.max;
    
    // Фильтр по поиску
    const searchMatch = searchQuery === "" || 
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase()));
    
    return sportMatch && categoryMatch && priceMatch && searchMatch;
  }) || [];

  // Show loading while data is being fetched
  if (!catalogItems || !readyBoxes || (telegramUser?.id && !dbUser)) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Загружаем каталог...</p>
        </div>
      </div>
    );
  }


  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button 
              className="p-2 -ml-2" 
              onClick={() => setLocation("/")}
            >
              <ArrowLeft className="w-6 h-6 text-black" />
            </button>
            <div>
              <h2 className="text-2xl font-bold text-black tracking-wide">КАТАЛОГ KAVARA</h2>
              <p className="text-gray-600 font-medium">
                {catalogItems?.length || 0} товаров
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 rounded-xl"
          >
            <Filter className="w-4 h-4" />
            Фильтры
          </Button>
        </div>
      </div>

      {/* Ready Boxes Carousel */}
      <div className="p-6 bg-white border-b border-gray-200">
        <h3 className="text-xl font-bold text-black mb-4 tracking-wide">ГОТОВЫЕ БОКСЫ</h3>
        <div className="flex gap-4 overflow-x-auto pb-2">
          {readyBoxes?.length === 0 ? (
            <p className="text-gray-500 text-sm">Готовые боксы не найдены</p>
          ) : (
            readyBoxes?.map((box) => (
              <div 
                key={box.id} 
                className="flex-shrink-0 w-48 bg-gray-50 rounded-2xl p-4 border border-gray-200 cursor-pointer"
                onClick={() => setLocation(`/box/${box.id}`)}
              >
                <img
                  src={box.imageUrl || ''}
                  alt={box.name}
                  className="w-full h-32 object-cover rounded-xl mb-3"
                />
                <h4 className="font-bold text-sm mb-2 truncate text-black">{box.name}</h4>
                <p className="text-xs text-gray-600 mb-3 line-clamp-2">{box.description}</p>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-black">{(typeof box.price === 'string' ? parseFloat(box.price) : box.price).toLocaleString()}₽</span>
                  <Button
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      setLocation(`/box/${box.id}`);
                    }}
                    className="bg-black text-white hover:bg-gray-800 text-xs px-3 py-1 rounded-xl"
                  >
                    Выбрать
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Catalog Products Header */}
      <div className="p-6 pb-4">
        <h3 className="text-xl font-bold text-black tracking-wide">КАТАЛОГ ТОВАРОВ</h3>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="px-6 pb-6 bg-gray-50 border-b border-gray-200 space-y-4">
          {/* Search */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">
              Поиск товаров
            </label>
            <Input
              placeholder="Введите название товара..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Category Filter */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">
              Категория товара
            </label>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Sport Type Filter */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">
              Вид спорта
            </label>
            <Select value={selectedSportType} onValueChange={setSelectedSportType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SPORT_TYPES.map((sport) => (
                  <SelectItem key={sport} value={sport}>
                    {sport}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Price Range Filter */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">
              Ценовой диапазон
            </label>
            <Select 
              value={selectedPriceRange.label} 
              onValueChange={(value) => {
                const range = PRICE_RANGES.find(r => r.label === value);
                if (range) setSelectedPriceRange(range);
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PRICE_RANGES.map((range) => (
                  <SelectItem key={range.label} value={range.label}>
                    {range.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Reset Filters */}
          <Button
            variant="outline"
            onClick={() => {
              setSelectedCategory("Все категории");
              setSelectedSportType("Все виды спорта");
              setSelectedPriceRange(PRICE_RANGES[0]);
              setSearchQuery("");
            }}
            className="w-full"
          >
            Сбросить фильтры
          </Button>
        </div>
      )}

      {/* Products Grid */}
      <div className="p-6">
        {filteredItems.length > 0 ? (
          <div className="space-y-6">
            {filteredItems.map((item) => (
              <BoxCard
                key={item.id}
                box={item}
                onSelect={handleSelectBox}
                onAddToCart={handleAddToCart}
                variant="default"
                userId={dbUser?.id}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg mb-4">
              Товары не найдены
            </p>
            <p className="text-gray-400">
              Попробуйте изменить фильтры поиска
            </p>
          </div>
        )}
      </div>

      {/* Size Selection Modal */}
      <Dialog open={!!selectedBoxForSize} onOpenChange={() => setSelectedBoxForSize(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Выберите размер</DialogTitle>
          </DialogHeader>
          
          {selectedBoxForSize && (
            <div className="space-y-6">
              {/* Product Info */}
              <div className="flex gap-4">
                <img
                  src={selectedBoxForSize.imageUrl || ''}
                  alt={selectedBoxForSize.name}
                  className="w-20 h-20 object-cover rounded-lg"
                />
                <div>
                  <h4 className="font-semibold text-lg">{selectedBoxForSize.name}</h4>
                  <p className="text-gray-600">{selectedBoxForSize.description}</p>
                  <p className="font-bold text-lg mt-1">{(typeof selectedBoxForSize.price === 'string' ? parseFloat(selectedBoxForSize.price) : selectedBoxForSize.price).toLocaleString()}₽</p>
                </div>
              </div>

              {/* Size Selection Block */}
              <div className="space-y-6">
                {/* Size Selection */}
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

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4 sticky bottom-0 bg-white border-t border-gray-200 -mx-6 px-6 py-4">
                <Button
                  variant="outline"
                  onClick={() => setSelectedBoxForSize(null)}
                  className="flex-1 rounded-xl"
                >
                  Отмена
                </Button>
                <Button
                  onClick={confirmAddToCart}
                  disabled={!selectedSize || addToCartMutation.isPending}
                  className="flex-1 bg-black text-white hover:bg-gray-800 rounded-xl"
                >
                  {addToCartMutation.isPending ? "Добавляем..." : "Добавить в корзину"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}