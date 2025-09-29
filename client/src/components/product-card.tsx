import { Button } from "@/components/ui/button";
import { ShoppingCart } from "lucide-react";
import type { Product } from "@shared/schema";
import { FavoriteButton } from "@/components/FavoriteButton";
import { useLocation } from "wouter";

interface ProductCardProps {
  product: Product;
  onSelect?: (product: Product) => void;
  onNotify?: (product: Product) => void;
  onAddToCart?: (product: Product) => void;
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
      </div>
      
      <div className="p-6">
        <h3 className="text-xl font-bold text-black mb-2 tracking-wide">{product.name.toUpperCase()}</h3>
        <p className="text-gray-600 mb-4 text-sm">{product.description}</p>
        
        {/* Product-specific info: sizes, brand, color */}
        {!isComingSoon && (
          <div className="mb-6">
            {product.sizes && product.sizes.length > 0 && (
              <div className="mb-3">
                <div className="text-xs font-bold text-black mb-2 tracking-wide">РАЗМЕРЫ:</div>
                <div className="flex flex-wrap gap-2">
                  {product.sizes.map((size: string, index: number) => (
                    <span key={index} className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs">
                      {size}
                    </span>
                  ))}
                </div>
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
                    onAddToCart?.(product);
                  }}
                  className="flex-1 border border-black text-black py-3 font-semibold tracking-wide hover:bg-black hover:text-white transition-colors flex items-center justify-center gap-2 rounded-xl"
                  data-testid={`button-add-to-cart-${product.id}`}
                >
                  <ShoppingCart className="w-4 h-4" />
                  В КОРЗИНУ
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