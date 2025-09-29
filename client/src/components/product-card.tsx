import { Button } from "@/components/ui/button";
import { ShoppingCart, Info } from "lucide-react";
import type { Product } from "@shared/schema";
import { FavoriteButton } from "@/components/FavoriteButton";
import { useLocation } from "wouter";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

interface ProductCardProps {
  product: Product;
  onSelect?: (product: Product) => void;
  onNotify?: (product: Product) => void;
  onAddToCart?: (product: Product, selectedSize?: string) => void;
  variant?: "default" | "coming-soon";
  userId?: string;
}

export default function ProductCard({ 
  product, 
  onSelect, 
  onNotify, 
  onAddToCart, 
  variant = "default", 
  userId 
}: ProductCardProps) {
  const isComingSoon = variant === "coming-soon" || !product.isAvailable;
  const [, setLocation] = useLocation();
  const [selectedSize, setSelectedSize] = useState<string>("");
  const [showSizeGuide, setShowSizeGuide] = useState(false);

  const handleCardClick = () => {
    if (!isComingSoon) {
      // Navigate to product detail page
      setLocation(`/product/${product.id}`);
    }
  };

  return (
    <div className={`border-2 border-black bg-white rounded-2xl overflow-hidden ${isComingSoon ? "opacity-60" : "cursor-pointer"}`} onClick={handleCardClick}>
      <div className="aspect-[4/3] relative overflow-hidden">
        <img 
          src={product.imageUrl || "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b"} 
          alt={product.name}
          className={`w-full h-full object-cover ${isComingSoon ? "grayscale" : ""}`}
        />
        {/* Favorite Button */}
        <div className="absolute top-2 right-2 z-10" onClick={(e) => e.stopPropagation()}>
          <FavoriteButton 
            boxId={product.id} 
            userId={userId} 
            size="sm" 
            variant="ghost"
            className="bg-white/80 hover:bg-white/90 backdrop-blur-sm rounded-full"
          />
        </div>
        {isComingSoon && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <span className="text-white font-bold text-lg tracking-wide">СКОРО</span>
          </div>
        )}
      </div>
      
      <div className="p-6">
        <h3 className="text-xl font-bold text-black mb-2 tracking-wide">{product.name.toUpperCase()}</h3>
        <p className="text-gray-600 mb-4 text-sm">{product.description}</p>
        
        {/* Product-specific info: sizes, brand, color */}
        {!isComingSoon && (
          <div className="mb-6">
            {product.sizes && product.sizes.length > 0 && (
              <div className="mb-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-xs font-bold text-black tracking-wide">РАЗМЕРЫ:</div>
                  <Dialog open={showSizeGuide} onOpenChange={setShowSizeGuide}>
                    <DialogTrigger asChild>
                      <button 
                        className="text-xs text-blue-600 hover:text-blue-800 underline flex items-center gap-1"
                        onClick={(e) => e.stopPropagation()}
                        data-testid="button-size-guide"
                      >
                        <Info className="w-3 h-3" />
                        Размерная сетка
                      </button>
                    </DialogTrigger>
                    <DialogContent onClick={(e) => e.stopPropagation()}>
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
                <div className="flex flex-wrap gap-2">
                  {product.sizes.map((size: string, index: number) => (
                    <button
                      key={index}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedSize(size === selectedSize ? "" : size);
                      }}
                      className={`px-3 py-2 rounded-lg text-sm font-medium border-2 transition-all ${
                        selectedSize === size
                          ? "border-black bg-black text-white"
                          : "border-gray-300 bg-white text-gray-700 hover:border-gray-400"
                      }`}
                      data-testid={`button-size-${size.toLowerCase()}`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
                {product.sizes.length > 0 && !selectedSize && (
                  <div className="text-xs text-red-500 mt-1">
                    ⚠️ Выберите размер для добавления в корзину
                  </div>
                )}
              </div>
            )}
            
            {(product.brand || product.color) && (
              <div className="text-xs text-gray-600 space-y-1">
                {product.brand && <div><strong>Бренд:</strong> {product.brand}</div>}
                {product.color && <div><strong>Цвет:</strong> {product.color}</div>}
                {product.category && <div><strong>Категория:</strong> {product.category}</div>}
              </div>
            )}
          </div>
        )}
        
        <div className="border-t border-gray-200 pt-4">
          {isComingSoon ? (
            <button 
              className="w-full border border-black text-black py-3 font-semibold tracking-wide hover:bg-black hover:text-white transition-colors rounded-xl"
              onClick={(e) => {
                e.stopPropagation();
                onNotify?.(product);
              }}
            >
              УВЕДОМИТЬ О ПОСТУПЛЕНИИ
            </button>
          ) : (
            <div className="space-y-3">
              <div className="text-2xl font-bold text-black text-center">
                {typeof product.price === 'string' ? parseFloat(product.price).toLocaleString('ru-RU') : product.price.toLocaleString('ru-RU')} ₽
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    
                    // Проверяем нужен ли размер для этого товара
                    const hasProductSizes = product.sizes && product.sizes.length > 0;
                    
                    if (hasProductSizes && !selectedSize) {
                      // Если у товара есть размеры, но размер не выбран - показываем предупреждение
                      return;
                    }
                    
                    onAddToCart?.(product, selectedSize);
                  }}
                  disabled={(product.sizes && product.sizes.length > 0 && !selectedSize) || false}
                  className={`flex-1 py-3 font-semibold tracking-wide transition-colors flex items-center justify-center gap-2 rounded-xl ${
                    product.sizes && product.sizes.length > 0 && !selectedSize
                      ? "border border-gray-300 text-gray-400 cursor-not-allowed"
                      : "border border-black text-black hover:bg-black hover:text-white"
                  }`}
                  data-testid={`button-add-to-cart-${product.id}`}
                >
                  <ShoppingCart className="w-4 h-4" />
                  {product.sizes && product.sizes.length > 0 && !selectedSize ? "ВЫБЕРИТЕ РАЗМЕР" : "В КОРЗИНУ"}
                </button>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCardClick();
                  }}
                  className="px-4 border border-gray-300 text-gray-600 py-3 font-semibold tracking-wide hover:bg-gray-100 transition-colors rounded-xl"
                  data-testid={`button-details-${product.id}`}
                  title="Подробнее"
                >
                  📝
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}