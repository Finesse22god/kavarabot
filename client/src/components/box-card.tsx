import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ShoppingCart, ChevronDown, ChevronUp, X } from "lucide-react";
import type { Box } from "@shared/schema";
import { useLocation } from "wouter";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import defaultBoxPhoto from "@assets/image 855_1762420246746.png";

interface BoxCardProps {
  box: Box | any;
  onSelect?: (box: Box | any) => void;
  onNotify?: (box: Box | any) => void;
  onAddToCart?: (box: Box | any, selectedSize?: string) => void;
  variant?: "default" | "coming-soon";
  userId?: string;
  index?: number; // для чередования цветов
  isExpanded?: boolean;
  onToggleExpand?: () => void;
}

export default function BoxCard({ box, onSelect, onNotify, onAddToCart, variant = "default", userId, index = 0, isExpanded = false, onToggleExpand }: BoxCardProps) {
  const isComingSoon = variant === "coming-soon" || !box.isAvailable;
  const [, setLocation] = useLocation();
  const [selectedTopSize, setSelectedTopSize] = useState<string>("");
  const [selectedBottomSize, setSelectedBottomSize] = useState<string>("");
  const [isPhotoDialogOpen, setIsPhotoDialogOpen] = useState(false);

  // Все боксы черные
  const isWhiteVariant = false;

  const handleToggleExpand = () => {
    if (onToggleExpand) {
      onToggleExpand();
    }
  };

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    
    // Проверяем что выбраны ОБА размера если они доступны
    if (availableTopSizes.length > 0 && !selectedTopSize) {
      alert('Пожалуйста, выберите размер ВЕРХ');
      return;
    }
    
    if (availableBottomSizes.length > 0 && !selectedBottomSize) {
      alert('Пожалуйста, выберите размер НИЗ');
      return;
    }
    
    if (onAddToCart) {
      const sizes = {
        top: selectedTopSize,
        bottom: selectedBottomSize
      };
      onAddToCart(box, JSON.stringify(sizes));
    }
  };
  
  // Проверка что можно добавить в корзину
  const canAddToCart = () => {
    // Если есть размеры ВЕРХ, они должны быть выбраны
    if (availableTopSizes.length > 0 && !selectedTopSize) return false;
    // Если есть размеры НИЗ, они должны быть выбраны
    if (availableBottomSizes.length > 0 && !selectedBottomSize) return false;
    return true;
  };
  
  const handleTopSizeClick = (e: React.MouseEvent, size: string) => {
    e.stopPropagation();
    setSelectedTopSize(size);
  };

  const handleBottomSizeClick = (e: React.MouseEvent, size: string) => {
    e.stopPropagation();
    setSelectedBottomSize(size);
  };

  const handleProductClick = (e: React.MouseEvent, product: any) => {
    e.stopPropagation();
    setLocation(`/product/${product.id}?from=boxes`);
  };

  const availableTopSizes = (box as any).availableTopSizes || [];
  const availableBottomSizes = (box as any).availableBottomSizes || [];

  // Компактный вид
  if (!isExpanded) {
    return (
      <div 
        onClick={handleToggleExpand}
        className={`relative rounded-[63px] py-6 pr-[45px] pl-[45px] h-[111px] flex items-center transition-all cursor-pointer ${
          isWhiteVariant 
            ? 'bg-white text-black border-2 border-black hover:shadow-lg' 
            : 'bg-black text-white border-2 border-white hover:shadow-lg'
        }`}
        data-testid={`box-card-${box.id}`}
      >
        <div className="flex items-center justify-between w-full">
          {/* Название */}
          <div className="flex-1">
            <h3 className="text-xl font-normal tracking-wide">
              {box.name.toUpperCase()}
            </h3>
          </div>

          {/* Плюс */}
          <div className="mx-6">
            <span className="text-5xl font-light">+</span>
          </div>

          {/* Цена */}
          <div className="flex-1 text-right">
            <div className="text-xl font-normal">
              {typeof box.price === 'string' ? parseFloat(box.price).toLocaleString('ru-RU') : box.price.toLocaleString('ru-RU')} ₽
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Развернутый вид (всегда белый фон, черный текст, черная кнопка)
  return (
    <div 
      className="relative rounded-[40px] py-6 pr-[45px] pl-[45px] transition-all bg-white text-black border-2 border-black"
      data-testid={`box-card-expanded-${box.id}`}
    >
      {/* Заголовок */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-normal tracking-wide">
          {box.name.toUpperCase()}
        </h3>
        <div className="text-xl font-normal">
          {typeof box.price === 'string' ? parseFloat(box.price).toLocaleString('ru-RU') : box.price.toLocaleString('ru-RU')} ₽
        </div>
      </div>

      {/* Содержимое */}
      {box.products && box.products.length > 0 && (
        <div className="mb-6">
          <div className="text-sm font-medium mb-3 pb-2 border-b border-black">
            Внутри:
          </div>
          <div className="grid grid-cols-2 gap-x-6 gap-y-2">
            {box.products.map((product: any, idx: number) => (
              <div 
                key={product.id || idx} 
                onClick={(e) => handleProductClick(e, product)}
                className="text-sm cursor-pointer transition-opacity hover:opacity-70 hover:text-gray-700 underline"
                style={{ fontFamily: 'IBM Plex Sans, sans-serif' }}
                data-testid={`product-item-${product.id}`}
              >
                {product.name}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Выбор размера ВЕРХ */}
      {availableTopSizes.length > 0 && (
        <div className="mb-6">
          <div className="text-sm font-medium mb-3 pb-2 border-b border-black">
            Выберите размер ВЕРХ:
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2">
            {availableTopSizes.map((size: string) => (
              <button
                key={size}
                onClick={(e) => handleTopSizeClick(e, size)}
                className={`px-4 py-2 rounded-lg font-semibold min-w-[48px] flex items-center justify-center transition-colors ${
                  selectedTopSize === size
                    ? 'bg-black text-white' 
                    : 'bg-transparent border border-black text-black hover:bg-gray-100'
                }`}
                data-testid={`button-top-size-${size}`}
              >
                {size}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Выбор размера НИЗ */}
      {availableBottomSizes.length > 0 && (
        <div className="mb-6">
          <div className="text-sm font-medium mb-3 pb-2 border-b border-black">
            Выберите размер НИЗ:
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2">
            {availableBottomSizes.map((size: string) => (
              <button
                key={size}
                onClick={(e) => handleBottomSizeClick(e, size)}
                className={`px-4 py-2 rounded-lg font-semibold min-w-[48px] flex items-center justify-center transition-colors ${
                  selectedBottomSize === size
                    ? 'bg-black text-white' 
                    : 'bg-transparent border border-black text-black hover:bg-gray-100'
                }`}
                data-testid={`button-bottom-size-${size}`}
              >
                {size}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Кнопки действий */}
      <div className="flex items-center justify-between gap-4 mb-6 pr-4">
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleToggleExpand();
          }}
          className="text-sm underline flex items-center gap-1 text-black hover:text-gray-700"
          data-testid={`button-collapse-${box.id}`}
        >
          Свернуть
          <ChevronUp className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsPhotoDialogOpen(true);
            }}
            className="px-3 py-2 sm:px-6 sm:py-2 rounded-full border-2 border-black text-black hover:bg-black hover:text-white transition-colors font-semibold text-xs sm:text-sm whitespace-nowrap"
            data-testid={`button-photo-${box.id}`}
          >
            ФОТО
          </button>

          <button
            onClick={handleAddToCart}
            disabled={!canAddToCart()}
            className={`px-4 py-2 sm:px-8 sm:py-3 rounded-full font-semibold transition-colors text-xs sm:text-base whitespace-nowrap ${
              canAddToCart()
                ? 'bg-black text-white hover:bg-gray-800 cursor-pointer'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed opacity-50'
            }`}
            data-testid={`button-add-to-cart-${box.id}`}
          >
            В КОРЗИНУ
          </button>
        </div>
      </div>

      {/* Dialog для показа фото */}
      <Dialog open={isPhotoDialogOpen} onOpenChange={setIsPhotoDialogOpen}>
        <DialogContent className="max-w-md w-[90vw] bg-black border-2 border-white rounded-3xl p-4 overflow-hidden">
          <DialogTitle className="sr-only">Фото бокса</DialogTitle>
          <div className="relative flex items-center justify-center">
            <button
              onClick={() => setIsPhotoDialogOpen(false)}
              className="absolute -top-2 -right-2 z-10 p-2 rounded-full bg-white text-black hover:bg-gray-200 transition-colors shadow-lg"
              data-testid="button-close-photo-dialog"
            >
              <X className="w-5 h-5" />
            </button>
            <img 
              src={box.photoUrl || defaultBoxPhoto} 
              alt="Фото бокса"
              loading="lazy"
              className="w-full max-h-[70vh] object-contain rounded-2xl"
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
