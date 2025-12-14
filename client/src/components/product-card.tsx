import { useState } from "react";
import { useLocation } from "wouter";
import { Eye, ShoppingCart } from "lucide-react";
import { FavoriteButton } from "@/components/FavoriteButton";
import { useTelegram } from "@/hooks/use-telegram";
import type { Product } from "@shared/schema";

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
  onNotify, 
  onAddToCart,
  variant = "default", 
  userId 
}: ProductCardProps) {
  const isComingSoon = variant === "coming-soon" || !product.isAvailable;
  const [, setLocation] = useLocation();
  const [selectedSize, setSelectedSize] = useState<string>("");
  const [showSizes, setShowSizes] = useState(false);
  const { hapticFeedback } = useTelegram();

  let parsedSizes = product.sizes;
  if (typeof product.sizes === 'string') {
    try {
      parsedSizes = JSON.parse(product.sizes);
    } catch (e) {
      parsedSizes = [];
    }
  }
  
  const hasSizes = parsedSizes && Array.isArray(parsedSizes) && parsedSizes.length > 0;

  // Проверка наличия на складе
  const inventory = product.inventory as Record<string, number> | null | undefined;
  
  // Получить доступные размеры (с остатком > 0)
  const getAvailableSizes = () => {
    if (!hasSizes || !parsedSizes) return [];
    if (!inventory) return parsedSizes; // Если инвентарь не настроен, все размеры доступны
    return parsedSizes.filter((size: string) => (inventory[size] || 0) > 0);
  };
  
  const availableSizes = getAvailableSizes();
  const hasAvailableStock = availableSizes.length > 0;
  
  // Проверка доступности конкретного размера
  const isSizeAvailable = (size: string) => {
    if (!inventory) return true; // Если инвентарь не настроен, размер доступен
    return (inventory[size] || 0) > 0;
  };

  const handleCardClick = () => {
    if (!isComingSoon) {
      hapticFeedback.impact('light');
      setLocation(`/product/${product.id}`);
    }
  };

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    
    // Проверка наличия товара
    if (!hasAvailableStock) {
      return;
    }
    
    hapticFeedback.impact('medium');
    if (hasSizes && !selectedSize) {
      setShowSizes(true);
      return;
    }
    if (onAddToCart) {
      onAddToCart(product, selectedSize || undefined);
    }
  };

  const handleSizeSelect = (e: React.MouseEvent, size: string) => {
    e.stopPropagation();
    
    // Не позволять выбирать размер без остатка
    if (!isSizeAvailable(size)) {
      return;
    }
    
    hapticFeedback.selection();
    setSelectedSize(size);
    setShowSizes(false);
    if (onAddToCart) {
      onAddToCart(product, size);
    }
  };

  return (
    <div 
      className={`bg-white rounded-2xl overflow-hidden border-2 border-black transition-all hover:shadow-xl ${isComingSoon ? "opacity-60" : "cursor-pointer"}`}
      onClick={handleCardClick}
    >
      <div className="aspect-[4/3] relative overflow-hidden bg-white p-3">
        <img 
          src={product.imageUrl || "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b"} 
          alt={product.name}
          loading="lazy"
          className={`w-full h-full object-contain transition-transform hover:scale-105 ${isComingSoon ? "grayscale" : ""}`}
        />
        <div className="absolute top-2 right-2 z-10" onClick={(e) => e.stopPropagation()}>
          <FavoriteButton 
            productId={product.id} 
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
        {hasSizes && !isComingSoon && parsedSizes && (
          <div className="absolute bottom-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded-full backdrop-blur-sm">
            {parsedSizes.length} размеров
          </div>
        )}
      </div>
      
      <div className="p-4">
        <h3 className="text-lg font-bold text-black mb-2 tracking-wide line-clamp-2" data-testid={`text-product-name-${product.id}`}>
          {product.name.toUpperCase()}
        </h3>

        {product.brand && (
          <p className="text-sm text-gray-600 mb-2">{product.brand}</p>
        )}
        
        <div className="text-2xl font-bold text-black mb-3 text-center" data-testid={`text-price-${product.id}`}>
          {typeof product.price === 'string' ? parseFloat(product.price).toLocaleString('ru-RU') : product.price.toLocaleString('ru-RU')} ₽
        </div>

        {hasSizes && showSizes && !isComingSoon && parsedSizes && (
          <div className="mb-3 p-3 bg-gray-50 rounded-xl" onClick={(e) => e.stopPropagation()}>
            <p className="text-xs font-semibold text-gray-700 mb-2">ВЫБЕРИТЕ РАЗМЕР:</p>
            <div className="grid grid-cols-5 gap-2">
              {parsedSizes.map((size: string) => {
                const available = isSizeAvailable(size);
                return (
                  <button
                    key={size}
                    onClick={(e) => handleSizeSelect(e, size)}
                    disabled={!available}
                    className={`border-2 rounded-lg py-2 text-sm font-bold transition-all ${
                      available 
                        ? "border-gray-300 hover:border-black hover:bg-black hover:text-white" 
                        : "border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed line-through"
                    }`}
                    data-testid={`button-size-${size.toLowerCase()}-${product.id}`}
                  >
                    {size}
                  </button>
                );
              })}
            </div>
            {!hasAvailableStock && (
              <p className="text-xs text-red-500 mt-2 text-center">Нет в наличии</p>
            )}
          </div>
        )}
        
        {isComingSoon ? (
          <button 
            className="w-full border-2 border-black text-black py-3 font-semibold tracking-wide hover:bg-black hover:text-white transition-colors rounded-xl"
            onClick={(e) => {
              e.stopPropagation();
              onNotify?.(product);
            }}
            data-testid={`button-notify-${product.id}`}
          >
            УВЕДОМИТЬ О ПОСТУПЛЕНИИ
          </button>
        ) : !hasAvailableStock ? (
          <button 
            className="w-full border-2 border-gray-300 text-gray-400 py-3 font-semibold tracking-wide cursor-not-allowed rounded-xl"
            onClick={(e) => {
              e.stopPropagation();
              onNotify?.(product);
            }}
            data-testid={`button-out-of-stock-${product.id}`}
          >
            НЕТ В НАЛИЧИИ
          </button>
        ) : (
          <div className="flex gap-2">
            <button 
              className="flex-1 bg-black text-white py-3 font-semibold tracking-wide hover:bg-gray-800 transition-colors rounded-xl flex items-center justify-center gap-2"
              onClick={handleAddToCart}
              data-testid={`button-add-to-cart-${product.id}`}
            >
              <ShoppingCart className="w-4 h-4" />
              {hasSizes && !selectedSize && showSizes ? 'ВЫБЕРИТЕ РАЗМЕР' : 'В КОРЗИНУ'}
            </button>
            <button
              className="px-4 border-2 border-black text-black hover:bg-black hover:text-white transition-colors rounded-xl"
              onClick={(e) => {
                e.stopPropagation();
                handleCardClick();
              }}
              data-testid={`button-view-${product.id}`}
            >
              <Eye className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
