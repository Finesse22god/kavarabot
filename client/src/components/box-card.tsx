import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ShoppingCart, ChevronDown, ChevronUp } from "lucide-react";
import type { Box } from "@shared/schema";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";

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
  const [selectedSize, setSelectedSize] = useState<string>("");

  // Все боксы черные
  const isWhiteVariant = false;

  const handleToggleExpand = () => {
    if (onToggleExpand) {
      onToggleExpand();
    }
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
    setLocation(`/product/${product.id}?from=boxes`);
  };

  const availableSizes = ["S", "M", "L", "XL", "2XL", "3XL"];

  return (
    <motion.div
      layout
      initial={false}
      animate={{
        backgroundColor: isExpanded ? "#ffffff" : "#000000",
        borderColor: isExpanded ? "#000000" : "#ffffff"
      }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
      onClick={!isExpanded ? handleToggleExpand : undefined}
      className={`relative rounded-[40px] p-6 cursor-pointer ${
        isExpanded ? 'border-2' : 'border-2'
      }`}
      data-testid={isExpanded ? `box-card-expanded-${box.id}` : `box-card-${box.id}`}
    >
      {/* Компактный вид */}
      {!isExpanded && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="flex items-center justify-between"
        >
          {/* Название */}
          <div className="flex-1">
            <h3 className="text-xl font-bold tracking-wide text-white">
              {box.name.toUpperCase()}
            </h3>
          </div>

          {/* Плюс */}
          <div className="mx-6">
            <span className="text-3xl font-light text-white">+</span>
          </div>

          {/* Цена и кнопка "Подробнее" */}
          <div className="flex-1 text-right">
            <div className="text-xl font-bold mb-1 text-white">
              {typeof box.price === 'string' ? parseFloat(box.price).toLocaleString('ru-RU') : box.price.toLocaleString('ru-RU')} ₽
            </div>
            <div
              className="text-sm underline flex items-center gap-1 ml-auto text-white"
              data-testid={`button-expand-${box.id}`}
            >
              Подробнее
              <ChevronDown className="w-4 h-4" />
            </div>
          </div>
        </motion.div>
      )}

      {/* Развернутый вид */}
      {isExpanded && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
        >
          {/* Заголовок */}
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold tracking-wide text-black">
              {box.name.toUpperCase()}
            </h3>
            <div className="text-xl font-bold text-black">
              {typeof box.price === 'string' ? parseFloat(box.price).toLocaleString('ru-RU') : box.price.toLocaleString('ru-RU')} ₽
            </div>
          </div>

          {/* Содержимое */}
          {box.products && box.products.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.3 }}
              className="mb-6"
            >
              <div className="text-sm font-medium mb-3 pb-2 border-b border-black">
                Внутри:
              </div>
              <div className="grid grid-cols-2 gap-x-6 gap-y-2">
                {box.products.map((product: any, idx: number) => (
                  <div 
                    key={product.id || idx} 
                    onClick={(e) => handleProductClick(e, product)}
                    className="text-sm cursor-pointer transition-opacity hover:opacity-70 hover:text-gray-700"
                    style={{ fontFamily: 'IBM Plex Sans, sans-serif' }}
                    data-testid={`product-item-${product.id}`}
                  >
                    {product.name}
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Выбор размера */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.3 }}
            className="mb-6"
          >
            <div className="text-sm font-medium mb-3 pb-2 border-b border-black">
              Выберите размер:
            </div>
            <div className="flex gap-2 overflow-x-auto pb-2">
              {availableSizes.map((size) => (
                <button
                  key={size}
                  onClick={(e) => handleSizeClick(e, size)}
                  className={`px-4 py-2 rounded-lg font-semibold min-w-[48px] flex items-center justify-center transition-colors ${
                    selectedSize === size
                      ? 'bg-black text-white' 
                      : 'bg-transparent border border-black text-black hover:bg-gray-100'
                  }`}
                  data-testid={`button-size-${size}`}
                >
                  {size}
                </button>
              ))}
            </div>
          </motion.div>

          {/* Кнопки действий */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.3 }}
            className="flex items-center justify-between gap-4 mb-24"
          >
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

            <button
              onClick={handleAddToCart}
              className="px-8 py-3 rounded-full font-semibold transition-colors bg-black text-white hover:bg-gray-800"
              data-testid={`button-add-to-cart-${box.id}`}
            >
              В КОРЗИНУ
            </button>
          </motion.div>
        </motion.div>
      )}
    </motion.div>
  );
}
