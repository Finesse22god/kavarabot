import { useLocation } from "wouter";
import { FavoriteButton } from "@/components/FavoriteButton";
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
  variant = "default", 
  userId 
}: ProductCardProps) {
  const isComingSoon = variant === "coming-soon" || !product.isAvailable;
  const [, setLocation] = useLocation();

  const handleCardClick = () => {
    if (!isComingSoon) {
      setLocation(`/product/${product.id}`);
    }
  };

  return (
    <div 
      className={`bg-white rounded-2xl overflow-hidden border-2 border-black ${isComingSoon ? "opacity-60" : "cursor-pointer"}`}
      onClick={handleCardClick}
    >
      <div className="aspect-[4/3] relative overflow-hidden">
        <img 
          src={product.imageUrl || "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b"} 
          alt={product.name}
          className={`w-full h-full object-cover ${isComingSoon ? "grayscale" : ""}`}
        />
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
      
      <div className="p-4">
        <h3 className="text-lg font-bold text-black mb-3 tracking-wide line-clamp-2" data-testid={`text-product-name-${product.id}`}>
          {product.name.toUpperCase()}
        </h3>
        
        <div className="text-2xl font-bold text-black mb-4 text-center" data-testid={`text-price-${product.id}`}>
          {typeof product.price === 'string' ? parseFloat(product.price).toLocaleString('ru-RU') : product.price.toLocaleString('ru-RU')} ₽
        </div>
        
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
        ) : (
          <button 
            className="w-full bg-black text-white py-3 font-semibold tracking-wide hover:bg-gray-800 transition-colors rounded-xl flex items-center justify-center gap-2"
            onClick={(e) => {
              e.stopPropagation();
              handleCardClick();
            }}
            data-testid={`button-add-to-cart-${product.id}`}
          >
            🛒 ДОБАВИТЬ В КОРЗИНУ
          </button>
        )}
      </div>
    </div>
  );
}
