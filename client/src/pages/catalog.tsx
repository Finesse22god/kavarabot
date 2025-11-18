import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { ArrowLeft, ShoppingCart, Search, ArrowUpDown, ArrowUp } from "lucide-react";
import { useTelegram } from "@/hooks/use-telegram";
import BoxCard from "@/components/box-card";
import ProductCard from "@/components/product-card";
import CatalogHeader from "@/components/catalog-header";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
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
  const [sortBy, setSortBy] = useState("default");
  const [showScrollTop, setShowScrollTop] = useState(false);

  // Функция прокрутки вверх
  const scrollToTop = () => {
    // Пробуем несколько способов для совместимости
    window.scrollTo({ top: 0, behavior: 'smooth' });
    document.documentElement.scrollTo?.({ top: 0, behavior: 'smooth' });
    document.body.scrollTo?.({ top: 0, behavior: 'smooth' });
  };






  const { data: catalogItems, isLoading, error } = useQuery({
    queryKey: [
      "/api/catalog",
      selectedCategory,
      selectedSportType,
      selectedPriceRange.label, // Use label instead of whole object
    ],
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
    staleTime: 5 * 60 * 1000, // Кэш на 5 минут
    gcTime: 10 * 60 * 1000, // Хранить в памяти 10 минут
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
        title: "✓ Добавлено в корзину",
        description: `Товар ${variables.selectedSize ? `(размер ${variables.selectedSize})` : ""} добавлен в корзину`,
      });
      
      // Инвалидируем кэш корзины для обновления счетчика
      queryClient.invalidateQueries({ queryKey: [`/api/cart/${dbUser?.id}`] });
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
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-white border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-white">Загружаем каталог...</p>
        </div>
      </div>
    );
  }

  // Show error if fetch failed
  if (error) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400">Ошибка загрузки каталога</p>
          <button onClick={() => window.location.reload()} className="mt-2 px-4 py-2 bg-white text-black rounded">
            Попробовать снова
          </button>
        </div>
      </div>
    );
  }

  // Debug info - removed in production


  return (
    <div className="min-h-screen bg-black pb-32">
      {/* Header */}
      <CatalogHeader activeTab="catalog" />

      {/* Catalog Products Header */}
      <div className="p-6 pb-4">
        <h3 className="text-xl font-bold text-white tracking-wide mb-4">КАТАЛОГ ТОВАРОВ</h3>
        
        {/* Category, Sort and Search in one row */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            {/* Category Filter */}
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="flex-1 border-2 border-gray-200 rounded-xl" data-testid="select-category">
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

            {/* Sort Icon */}
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="border-2 border-gray-200 rounded-xl flex-shrink-0"
                  data-testid="button-sort"
                >
                  <ArrowUpDown className="w-4 h-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-64" align="end">
                <div className="space-y-2">
                  <h4 className="font-medium text-sm mb-3">Сортировка</h4>
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="w-full">
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
              </PopoverContent>
            </Popover>

            {/* Search Icon */}
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="border-2 border-gray-200 rounded-xl flex-shrink-0"
                  data-testid="button-search"
                >
                  <Search className="w-4 h-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80" align="end">
                <div className="space-y-2">
                  <h4 className="font-medium text-sm mb-3">Поиск товаров</h4>
                  <Input
                    placeholder="Введите название товара..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full"
                    data-testid="input-search"
                  />
                </div>
              </PopoverContent>
            </Popover>
          </div>

          {/* Reset Filters Button */}
          {(selectedCategory !== "Все категории" || searchQuery || sortBy !== "default") && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSelectedCategory("Все категории");
                setSearchQuery("");
                setSortBy("default");
              }}
              className="self-start rounded-xl text-xs"
            >
              Сбросить фильтры
            </Button>
          )}
        </div>
      </div>

      {/* Products Grid */}
      <div className="p-6">
        
        {filteredItems.length > 0 ? (
          <div className="space-y-6 mb-8">
            {filteredItems.map((item, index) => (
              <>
                {/* Невидимый триггер после 6-го товара */}
                {index === 5 && (
                  <div
                    ref={(el) => {
                      if (el) {
                        const observer = new IntersectionObserver(
                          ([entry]) => {
                            // Кнопка появляется когда триггер выходит из видимости (прокрутили дальше 6 товаров)
                            setShowScrollTop(!entry.isIntersecting);
                          },
                          { threshold: 0, rootMargin: '0px' }
                        );
                        observer.observe(el);
                      }
                    }}
                    className="h-0"
                  />
                )}
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
              </>
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

      {/* Scroll to Top Button */}
      {showScrollTop && (
        <Button
          onClick={scrollToTop}
          className="fixed bottom-24 right-6 w-12 h-12 rounded-full bg-white text-black shadow-lg hover:bg-gray-100 transition-all duration-300 z-50"
          data-testid="button-scroll-top"
        >
          <ArrowUp className="w-6 h-6" />
        </Button>
      )}
    </div>
  );
}