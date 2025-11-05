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

  // Чередование цветов: каждый второй бокс белый
  const isWhiteVariant = index % 2 === 1;

  const handleToggleExpand = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsExpanded(!isExpanded);
  };

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onAddToCart) {
      onAddToCart(box, selectedSize);
    }
  };

  const availableSizes = ["S", "M", "L", "XL", "2XL", "3XL"];

  // Компактный вид
  if (!isExpanded) {
    return (
      <div 
        className={`relative rounded-[40px] p-6 transition-all ${
          isWhiteVariant 
            ? 'bg-white text-black border-2 border-black' 
            : 'bg-black text-white border-2 border-white'
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
            <button
              onClick={handleToggleExpand}
              className={`text-sm underline flex items-center gap-1 ml-auto ${
                isWhiteVariant ? 'text-black hover:text-gray-700' : 'text-white hover:text-gray-300'
              }`}
              data-testid={`button-expand-${box.id}`}
            >
              Подробнее
              <ChevronDown className="w-4 h-4" />
            </button>
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
      {box.contents && box.contents.length > 0 && (
        <div className="mb-6">
          <div className={`text-sm font-medium mb-3 pb-2 border-b ${
            isWhiteVariant ? 'border-black' : 'border-white'
          }`}>
            Внутри:
          </div>
          <div className="grid grid-cols-2 gap-x-6 gap-y-2">
            {box.contents.map((item: string, idx: number) => (
              <div key={idx} className="text-sm">
                {item}
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
              onClick={() => setSelectedSize(size)}
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
          onClick={handleToggleExpand}
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
