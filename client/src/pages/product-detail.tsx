import { useState, useCallback, useEffect } from "react";
import { useRoute, useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, ShoppingCart, ChevronDown, Info, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useTelegram } from "@/hooks/use-telegram";
import useEmblaCarousel from "embla-carousel-react";
import type { Product } from "@shared/schema";

export default function ProductDetail() {
  const [, params] = useRoute("/product/:id");
  const [, setLocation] = useLocation();
  const { user: telegramUser } = useTelegram();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: dbUser } = useQuery<{ id: string; telegramId: string; firstName?: string; lastName?: string; username?: string; loyaltyPoints: number }>({
    queryKey: [`/api/users/telegram/${telegramUser?.id}`],
    enabled: !!telegramUser?.id
  });
  
  const [selectedSize, setSelectedSize] = useState("");
  const [showSizeGuide, setShowSizeGuide] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: false });
  
  const scrollPrev = useCallback(() => {
    if (emblaApi) emblaApi.scrollPrev();
  }, [emblaApi]);

  const scrollNext = useCallback(() => {
    if (emblaApi) emblaApi.scrollNext();
  }, [emblaApi]);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setCurrentSlide(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on("select", onSelect);
    return () => {
      emblaApi.off("select", onSelect);
    };
  }, [emblaApi, onSelect]);

  const { data: product, isLoading, error } = useQuery<Product>({
    queryKey: [`/api/products/${params?.id}`],
    enabled: !!params?.id,
  });

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
      setLocation("/cart");
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
    if (hasSizes && !selectedSize) {
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

  let parsedSizes = product.sizes;
  
  if (typeof product.sizes === 'string') {
    try {
      parsedSizes = JSON.parse(product.sizes);
    } catch (e) {
      console.error('Failed to parse sizes:', e);
      parsedSizes = [];
    }
  }
  
  const hasSizes = parsedSizes && Array.isArray(parsedSizes) && parsedSizes.length > 0;

  return (
    <div className="min-h-screen bg-white pb-32">
      <div className="p-4 border-b border-gray-200 sticky top-0 bg-white z-10">
        <button 
          className="p-2 -ml-2" 
          onClick={() => setLocation("/catalog")}
          data-testid="button-back"
        >
          <ArrowLeft className="w-6 h-6 text-black" />
        </button>
      </div>

      <div className="aspect-square relative overflow-hidden bg-gray-100">
        {(() => {
          let productImages: string[] = [];
          
          if (product.images && Array.isArray(product.images) && product.images.length > 0) {
            productImages = product.images;
          } else if (product.imageUrl) {
            productImages = [product.imageUrl];
          } else {
            productImages = ["https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b"];
          }

          if (productImages.length === 1) {
            return (
              <img
                src={productImages[0]}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            );
          }

          return (
            <>
              <div className="overflow-hidden" ref={emblaRef}>
                <div className="flex">
                  {productImages.map((image, index) => (
                    <div key={index} className="flex-[0_0_100%] min-w-0">
                      <img
                        src={image}
                        alt={`${product.name} - фото ${index + 1}`}
                        className="w-full h-full object-cover aspect-square"
                      />
                    </div>
                  ))}
                </div>
              </div>
              
              {productImages.length > 1 && (
                <>
                  <button
                    onClick={scrollPrev}
                    className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-2 shadow-lg transition-all"
                    data-testid="button-prev-image"
                  >
                    <ChevronLeft className="w-6 h-6 text-black" />
                  </button>
                  <button
                    onClick={scrollNext}
                    className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-2 shadow-lg transition-all"
                    data-testid="button-next-image"
                  >
                    <ChevronRight className="w-6 h-6 text-black" />
                  </button>
                  
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                    {productImages.map((_, index) => (
                      <div
                        key={index}
                        className={`w-2 h-2 rounded-full transition-all ${
                          index === currentSlide ? "bg-white w-6" : "bg-white/60"
                        }`}
                      />
                    ))}
                  </div>
                </>
              )}
            </>
          );
        })()}
      </div>

      <div className="p-4 space-y-4">
        <div>
          <h1 className="text-2xl font-bold text-black mb-2 tracking-wide" data-testid="text-product-name">
            {product.name.toUpperCase()}
          </h1>
          <div className="text-3xl font-bold text-black" data-testid="text-product-price">
            {typeof product.price === 'string' ? parseFloat(product.price).toLocaleString('ru-RU') : product.price.toLocaleString('ru-RU')} ₽
          </div>
        </div>

        {hasSizes && (
          <div className="bg-gray-50 rounded-xl p-4 border-2 border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-black">ВЫБЕРИТЕ РАЗМЕР</h3>
              <Dialog open={showSizeGuide} onOpenChange={setShowSizeGuide}>
                <DialogTrigger asChild>
                  <button 
                    className="text-sm text-blue-600 hover:text-blue-800 underline flex items-center gap-1"
                    data-testid="button-size-guide"
                  >
                    <Info className="w-4 h-4" />
                    Размерная сетка
                  </button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Размерная сетка</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="text-sm text-gray-600">
                      Рекомендации по выбору размера для спортивной одежды:
                    </div>
                    <div className="grid grid-cols-4 gap-2 text-xs">
                      <div className="font-bold">Размер</div>
                      <div className="font-bold">Грудь (см)</div>
                      <div className="font-bold">Талия (см)</div>
                      <div className="font-bold">Бедра (см)</div>
                      
                      <div>XS</div><div>82-86</div><div>66-70</div><div>90-94</div>
                      <div>S</div><div>86-90</div><div>70-74</div><div>94-98</div>
                      <div>M</div><div>90-94</div><div>74-78</div><div>98-102</div>
                      <div>L</div><div>94-98</div><div>78-82</div><div>102-106</div>
                      <div>XL</div><div>98-102</div><div>82-86</div><div>106-110</div>
                      <div>XXL</div><div>102-108</div><div>86-92</div><div>110-116</div>
                    </div>
                    <div className="text-xs text-gray-500">
                      💡 Спортивная одежда должна сидеть плотно, но не сковывать движения. При сомнениях выбирайте больший размер.
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
            
            <Tabs value={selectedSize} onValueChange={setSelectedSize} className="w-full">
              <TabsList className="grid w-full grid-cols-5 gap-2 bg-transparent h-auto p-0">
                {parsedSizes?.map((size) => (
                  <TabsTrigger 
                    key={size} 
                    value={size}
                    className="border-2 border-gray-300 data-[state=active]:border-black data-[state=active]:bg-black data-[state=active]:text-white rounded-lg py-3 font-bold transition-all hover:border-gray-400"
                    data-testid={`tab-size-${size.toLowerCase()}`}
                  >
                    {size}
                  </TabsTrigger>
                ))}
              </TabsList>
              {parsedSizes?.map((size) => (
                <TabsContent key={size} value={size} className="mt-3">
                  <div className="text-sm text-green-600 font-medium bg-green-50 p-2 rounded-lg">
                    ✓ Размер {size} выбран
                  </div>
                </TabsContent>
              ))}
            </Tabs>
            
            {!selectedSize && (
              <div className="text-sm text-orange-600 mt-3 bg-orange-50 p-2 rounded-lg">
                ⚠️ Выберите размер для добавления в корзину
              </div>
            )}
          </div>
        )}

        {product.description && (
          <Collapsible>
            <CollapsibleTrigger className="w-full flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors" data-testid="button-description">
              <span className="font-bold text-black">ОПИСАНИЕ</span>
              <ChevronDown className="w-5 h-5 text-black" />
            </CollapsibleTrigger>
            <CollapsibleContent className="px-4 py-3">
              <p className="text-gray-700 leading-relaxed">{product.description}</p>
            </CollapsibleContent>
          </Collapsible>
        )}

        {(product.brand || product.color || product.category) && (
          <Collapsible>
            <CollapsibleTrigger className="w-full flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors" data-testid="button-details">
              <span className="font-bold text-black">СОСТАВ</span>
              <ChevronDown className="w-5 h-5 text-black" />
            </CollapsibleTrigger>
            <CollapsibleContent className="px-4 py-3 space-y-2">
              {product.brand && (
                <div className="flex justify-between py-2 border-b border-gray-200">
                  <span className="text-gray-600">Бренд</span>
                  <span className="font-medium text-black">{product.brand}</span>
                </div>
              )}
              {product.color && (
                <div className="flex justify-between py-2 border-b border-gray-200">
                  <span className="text-gray-600">Цвет</span>
                  <span className="font-medium text-black">{product.color}</span>
                </div>
              )}
              {product.category && (
                <div className="flex justify-between py-2">
                  <span className="text-gray-600">Категория</span>
                  <span className="font-medium text-black">{product.category}</span>
                </div>
              )}
            </CollapsibleContent>
          </Collapsible>
        )}

        <div className="fixed bottom-0 left-0 right-0 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] bg-white border-t-2 border-gray-200 shadow-lg z-[100]">
          <div className="max-w-md mx-auto">
            <Button
              onClick={handleAddToCart}
              disabled={addToCartMutation.isPending || (hasSizes && !selectedSize)}
              className="w-full bg-black text-white hover:bg-gray-800 py-6 text-lg font-bold tracking-wide disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed rounded-xl transition-all"
              data-testid="button-add-to-cart"
            >
              {addToCartMutation.isPending ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full"></div>
                  <span>ДОБАВЛЯЕМ...</span>
                </div>
              ) : (
                <div className="flex items-center justify-center space-x-2">
                  <ShoppingCart className="w-5 h-5" />
                  <span>{hasSizes && !selectedSize ? 'ВЫБЕРИТЕ РАЗМЕР' : 'ДОБАВИТЬ В КОРЗИНУ'}</span>
                </div>
              )}
            </Button>
            {hasSizes && !selectedSize && (
              <p className="text-xs text-center text-gray-500 mt-2">
                Сначала выберите размер выше
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
