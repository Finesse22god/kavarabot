import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ShoppingCart, ChevronDown, ChevronUp } from "lucide-react";
import type { Box } from "@shared/schema";
import { useLocation } from "wouter";

interface BoxCardProps {
  box: Box | any;
  onSelect?: (box: Box | any) => void;
  onNotify?: (box: Box | any) => void;
  onAddToCart?: (box: Box | any, selectedSize?: string) => void;
  variant?: "default" | "coming-soon";
  userId?: string;
  index?: number; // для чередования цветов
}

export default function BoxCard({ box, onSelect, onNotify, onAddToCart, variant = "default", userId, index = 0 }: BoxCardProps) {
  const isComingSoon = variant === "coming-soon" || !box.isAvailable;
  const [, setLocation] = useLocation();
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedSize, setSelectedSize] = useState<string>("");

  // Все боксы черные
  const isWhiteVariant = false;

  const handleToggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onAddToCart) {
      onAddToCart(box, selectedSize);
    }
  };
  
  const handleSizeClick = (e: React.MouseEvent, size: string) => {
    e.stopPropagation();
    setSelectedSize(size);
  };

  const handleProductClick = (e: React.MouseEvent, product: any) => {
    e.stopPropagation();
    setLocation(`/product/${product.id}`);
  };

  const availableSizes = ["S", "M", "L", "XL", "2XL", "3XL"];

  // Компактный вид
  if (!isExpanded) {
    return (
      <div 
        onClick={handleToggleExpand}
        className={`relative rounded-[40px] p-6 transition-all cursor-pointer ${
          isWhiteVariant 
            ? 'bg-white text-black border-2 border-black hover:shadow-lg' 
            : 'bg-black text-white border-2 border-white hover:shadow-lg'
        }`}
        data-testid={`box-card-${box.id}`}
      >
        <div className="flex items-center justify-between">
          {/* Название */}
          <div className="flex-1">
            <h3 className="text-xl font-bold tracking-wide">
              {box.name.toUpperCase()}
            </h3>
          </div>

          {/* Плюс */}
          <div className="mx-6">
            <span className="text-3xl font-light">+</span>
          </div>

          {/* Цена и кнопка "Подробнее" */}
          <div className="flex-1 text-right">
            <div className="text-xl font-bold mb-1">
              {typeof box.price === 'string' ? parseFloat(box.price).toLocaleString('ru-RU') : box.price.toLocaleString('ru-RU')} ₽
            </div>
            <div
              className={`text-sm underline flex items-center gap-1 ml-auto ${
                isWhiteVariant ? 'text-black' : 'text-white'
              }`}
              data-testid={`button-expand-${box.id}`}
            >
              Подробнее
              <ChevronDown className="w-4 h-4" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Развернутый вид
  return (
    <div 
      className={`relative rounded-[40px] p-6 transition-all ${
        isWhiteVariant 
          ? 'bg-white text-black border-2 border-black' 
          : 'bg-black text-white border-2 border-white'
      }`}
      data-testid={`box-card-expanded-${box.id}`}
    >
      {/* Заголовок */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold tracking-wide">
          {box.name.toUpperCase()}
        </h3>
        <div className="text-xl font-bold">
          {typeof box.price === 'string' ? parseFloat(box.price).toLocaleString('ru-RU') : box.price.toLocaleString('ru-RU')} ₽
        </div>
      </div>

      {/* Содержимое */}
      {box.products && box.products.length > 0 && (
        <div className="mb-6">
          <div className={`text-sm font-medium mb-3 pb-2 border-b ${
            isWhiteVariant ? 'border-black' : 'border-white'
          }`}>
            Внутри:
          </div>
          <div className="grid grid-cols-2 gap-x-6 gap-y-2">
            {box.products.map((product: any, idx: number) => (
              <div 
                key={product.id || idx} 
                onClick={(e) => handleProductClick(e, product)}
                className={`text-sm cursor-pointer transition-opacity hover:opacity-70 ${
                  isWhiteVariant ? 'hover:text-gray-700' : 'hover:text-gray-300'
                }`}
                style={{ fontFamily: 'IBM Plex Sans, sans-serif' }}
                data-testid={`product-item-${product.id}`}
              >
                {product.name}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Выбор размера */}
      <div className="mb-6">
        <div className={`text-sm font-medium mb-3 pb-2 border-b ${
          isWhiteVariant ? 'border-black' : 'border-white'
        }`}>
          Выберите размер:
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2">
          {availableSizes.map((size) => (
            <button
              key={size}
              onClick={(e) => handleSizeClick(e, size)}
              className={`px-4 py-2 rounded-lg font-semibold min-w-[48px] transition-colors ${
                selectedSize === size
                  ? (isWhiteVariant ? 'bg-black text-white' : 'bg-white text-black')
                  : (isWhiteVariant 
                      ? 'bg-transparent border border-black text-black hover:bg-gray-100' 
                      : 'bg-transparent border border-white text-white hover:bg-gray-800')
              }`}
              data-testid={`button-size-${size}`}
            >
              {size}
            </button>
          ))}
          <button
            onClick={(e) => e.stopPropagation()}
            className={`px-3 py-2 rounded-lg font-semibold ${
              isWhiteVariant 
                ? 'bg-transparent border border-black text-black hover:bg-gray-100' 
                : 'bg-transparent border border-white text-white hover:bg-gray-800'
            }`}
          >
            ...
          </button>
        </div>
      </div>

      {/* Кнопки действий */}
      <div className="flex items-center justify-between gap-4">
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleToggleExpand();
          }}
          className={`text-sm underline flex items-center gap-1 ${
            isWhiteVariant ? 'text-black hover:text-gray-700' : 'text-white hover:text-gray-300'
          }`}
          data-testid={`button-collapse-${box.id}`}
        >
          Свернуть
          <ChevronUp className="w-4 h-4" />
        </button>

        <button
          onClick={handleAddToCart}
          className={`px-8 py-3 rounded-full font-semibold transition-colors ${
            isWhiteVariant 
              ? 'bg-black text-white hover:bg-gray-800' 
              : 'bg-white text-black hover:bg-gray-100'
          }`}
          data-testid={`button-add-to-cart-${box.id}`}
        >
          В КОРЗИНУ
        </button>
      </div>
    </div>
  );
}
