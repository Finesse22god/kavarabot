import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { ArrowLeft, Filter, ShoppingCart } from "lucide-react";
import { useTelegram } from "@/hooks/use-telegram";
import BoxCard from "@/components/box-card";
import ProductCard from "@/components/product-card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import type { Box, Product } from "@shared/schema";

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

const SORT_OPTIONS = [
  { label: "По умолчанию", value: "default" },
  { label: "Цена: по возрастанию", value: "price-asc" },
  { label: "Цена: по убыванию", value: "price-desc" },
  { label: "Название: А-Я", value: "name-asc" },
  { label: "Название: Я-А", value: "name-desc" },
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
  const [sortBy, setSortBy] = useState("default");






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
      return response.json() as Promise<Product[]>;
    },
  });

  // Fetch boxes for horizontal scroll section
  const { data: boxes, isLoading: boxesLoading } = useQuery<Box[]>({
    queryKey: ["/api/boxes"],
    queryFn: async () => {
      const response = await fetch("/api/boxes");
      if (!response.ok) throw new Error("Failed to fetch boxes");
      return response.json();
    },
  });

  // Add to cart mutation
  const addToCartMutation = useMutation({
    mutationFn: async ({ userId, productId, quantity, selectedSize, itemType }: {
      userId: string;
      productId: string;
      quantity: number;
      selectedSize?: string;
      itemType: string;
    }) => {
      const response = await fetch("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          productId,
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
      // Показываем уведомление об успехе
      toast({
        title: "Добавлено в корзину",
        description: `Товар ${variables.selectedSize ? `(размер ${variables.selectedSize})` : ""} добавлен в корзину`,
      });
      
      // Инвалидируем кэш корзины для обновления счетчика
      queryClient.invalidateQueries({ queryKey: ['/api/cart', dbUser?.id] });
      
      // Автоматически открываем корзину
      setTimeout(() => {
        setLocation("/cart");
      }, 500);
    },
    onError: (error: Error) => {
      toast({
        title: "Ошибка",
        description: error.message || "Не удалось добавить товар в корзину",
        variant: "destructive",
      });
    },
  });




  // Фильтрация товаров
  let filteredItems = catalogItems?.filter(item => {
    // Фильтр по категории - пока отключен, так как товары имеют другие категории (clothing, accessories)
    const categoryMatch = selectedCategory === "Все категории" || true; // Показать все товары пока фильтр не настроен
    
    // Фильтр по поиску
    const searchMatch = searchQuery === "" || 
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase()));
    
    return categoryMatch && searchMatch;
  }) || [];

  // Сортировка товаров
  if (sortBy !== "default" && filteredItems) {
    filteredItems = [...filteredItems].sort((a, b) => {
      const priceA = typeof a.price === 'string' ? parseFloat(a.price) : a.price;
      const priceB = typeof b.price === 'string' ? parseFloat(b.price) : b.price;

      switch (sortBy) {
        case "price-asc":
          return priceA - priceB;
        case "price-desc":
          return priceB - priceA;
        case "name-asc":
          return a.name.localeCompare(b.name);
        case "name-desc":
          return b.name.localeCompare(a.name);
        default:
          return 0;
      }
    });
  }

  // Show loading while data is being fetched
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Загружаем каталог...</p>
        </div>
      </div>
    );
  }

  // Show error if fetch failed
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600">Ошибка загрузки каталога</p>
          <button onClick={() => window.location.reload()} className="mt-2 px-4 py-2 bg-blue-500 text-white rounded">
            Попробовать снова
          </button>
        </div>
      </div>
    );
  }

  // Debug info - removed in production


  return (
    <div className="min-h-screen bg-white pb-20">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
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
      </div>


      {/* Boxes Section */}
      {!boxesLoading && boxes && boxes.length > 0 && (
        <div className="p-6 pb-4">
          <h3 className="text-xl font-bold text-black tracking-wide mb-4">ГОТОВЫЕ БОКСЫ</h3>
          <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
            {boxes.map((box) => (
              <div
                key={box.id}
                className="flex-shrink-0 w-64 h-96 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden cursor-pointer flex flex-col"
                onClick={() => setLocation(`/box/${box.id}`)}
                data-testid={`box-card-${box.id}`}
              >
                <div className="relative">
                  <img
                    src={box.imageUrl || ''}
                    alt={box.name}
                    className="w-full h-40 object-cover"
                  />
                  <div className="absolute top-3 right-3 bg-black text-white px-2 py-1 rounded-full text-xs font-semibold">
                    {(typeof box.price === 'string' ? parseFloat(box.price) : box.price).toLocaleString()}₽
                  </div>
                </div>
                <div className="p-4 flex flex-col flex-1">
                  <h4 className="font-bold text-lg mb-2 line-clamp-1">{box.name}</h4>
                  <p className="text-gray-600 text-sm mb-3 line-clamp-2 flex-1">{box.description}</p>
                  <Button 
                    className="w-full bg-black hover:bg-gray-800 text-white rounded-xl font-semibold mt-auto"
                    onClick={(e) => {
                      e.stopPropagation();
                      setLocation(`/box/${box.id}`);
                    }}
                    data-testid={`button-add-to-cart-${box.id}`}
                  >
                    <ShoppingCart className="w-4 h-4 mr-2" />
                    В корзину
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Catalog Products Header */}
      <div className="p-6 pb-4">
        <h3 className="text-xl font-bold text-black tracking-wide mb-4">КАТАЛОГ ТОВАРОВ</h3>
        
        {/* Filters and Sort in one row - mobile optimized */}
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 rounded-xl flex-shrink-0"
            data-testid="button-toggle-filters"
          >
            <Filter className="w-4 h-4" />
            Фильтры
          </Button>
          
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="flex-1 border-2 border-gray-200 rounded-xl" data-testid="select-sort">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SORT_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
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


          {/* Reset Filters */}
          <Button
            variant="outline"
            onClick={() => {
              setSelectedCategory("Все категории");
              setSearchQuery("");
              setSortBy("default");
            }}
            className="w-full rounded-xl"
          >
            Сбросить фильтры
          </Button>
        </div>
      )}

      {/* Products Grid */}
      <div className="p-6">
        
        {filteredItems.length > 0 ? (
          <div className="space-y-6 mb-8">
            {filteredItems.map((item) => (
              <ProductCard
                key={item.id}
                product={item as Product}
                variant="default"
                userId={dbUser?.id}
                onAddToCart={(product, selectedSize) => {
                  if (!dbUser?.id) {
                    toast({
                      title: "Ошибка авторизации",
                      description: "Необходимо войти в систему для добавления товаров в корзину",
                      variant: "destructive",
                    });
                    return;
                  }

                  // Определяем тип товара (product vs box) на основе наличия sizes
                  const itemType = product.sizes && product.sizes.length > 0 ? "product" : "box";
                  
                  // Добавляем товар в корзину
                  addToCartMutation.mutate({
                    userId: dbUser.id,
                    productId: product.id,
                    quantity: 1,
                    selectedSize: selectedSize || undefined,
                    itemType: itemType
                  });
                }}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-red-100 border-2 border-red-400 rounded">
            <p className="text-red-600 text-lg mb-4">
              ❌ Товары не найдены
            </p>
            <p className="text-red-500">
              Попробуйте изменить фильтры поиска
            </p>
            <p className="text-sm text-red-400 mt-2">
              catalogItems: {catalogItems?.length || 0}, filteredItems: {filteredItems.length}
            </p>
          </div>
        )}
      </div>

    </div>
  );
}