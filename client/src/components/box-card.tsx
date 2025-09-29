import { Button } from "@/components/ui/button";
import { ShoppingCart } from "lucide-react";
import type { Box } from "@shared/schema";
import { FavoriteButton } from "@/components/FavoriteButton";
import { useLocation } from "wouter";

interface BoxCardProps {
  box: Box | any; // Allow both Box and Product types
  onSelect?: (box: Box | any) => void;
  onNotify?: (box: Box | any) => void;
  onAddToCart?: (box: Box | any) => void;
  variant?: "default" | "coming-soon";
  userId?: string;
}

export default function BoxCard({ box, onSelect, onNotify, onAddToCart, variant = "default", userId }: BoxCardProps) {
  const isComingSoon = variant === "coming-soon" || !box.isAvailable;
  const [, setLocation] = useLocation();

  const handleCardClick = () => {
    if (!isComingSoon) {
      // Check if this is a Product (has sizes array) or Box (has contents array)
      // Debug logging - remove in production
      console.log('🔍 Clicking on item:', { 
        id: box.id, 
        name: box.name,
        sizes: box.sizes, 
        sizesIsArray: Array.isArray(box.sizes),
        sizesLength: box.sizes?.length,
        contents: box.contents, 
        hasContents: !!box.contents,
        type: (box.sizes && Array.isArray(box.sizes) && box.sizes.length > 0) ? 'PRODUCT' : 'BOX' 
      });
      if (box.sizes && Array.isArray(box.sizes) && box.sizes.length > 0) {
        // This is a Product - redirect to product page
        console.log('Redirecting to product page:', `/product/${box.id}`);
        setLocation(`/product/${box.id}`);
      } else if (box.contents || !box.sizes) {
        // This is a Box - redirect to box page
        console.log('Redirecting to box page:', `/box/${box.id}`);
        setLocation(`/box/${box.id}`);
      }
    }
  };

  return (
    <div className={`border-2 border-black bg-white rounded-2xl overflow-hidden ${isComingSoon ? "opacity-60" : "cursor-pointer"}`} onClick={handleCardClick}>
      <div className="aspect-[4/3] relative overflow-hidden">
        <img 
          src={box.imageUrl || "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b"} 
          alt={box.name}
          className={`w-full h-full object-cover ${isComingSoon ? "grayscale" : ""}`}
        />
        {/* Favorite Button */}
        <div className="absolute top-2 right-2 z-10" onClick={(e) => e.stopPropagation()}>
          <FavoriteButton 
            boxId={box.id} 
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
        <h3 className="text-xl font-bold text-black mb-2 tracking-wide">{box.name.toUpperCase()}</h3>
        <p className="text-gray-600 mb-4 text-sm">{box.description}</p>
        
        {box.contents && box.contents.length > 0 && !isComingSoon && (
          <div className="mb-6">
            <div className="text-xs font-bold text-black mb-2 tracking-wide">СОСТАВ:</div>
            <ul className="text-sm text-gray-700 space-y-1">
              {box.contents.map((item: string, index: number) => (
                <li key={index} className="flex items-start">
                  <span className="text-black mr-2">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
        
        <div className="border-t border-gray-200 pt-4">
          {isComingSoon ? (
            <button 
              className="w-full border border-black text-black py-3 font-semibold tracking-wide hover:bg-black hover:text-white transition-colors rounded-xl"
              onClick={() => onNotify?.(box)}
            >
              УВЕДОМИТЬ О ПОСТУПЛЕНИИ
            </button>
          ) : (
            <div className="space-y-3">
              <div className="text-2xl font-bold text-black text-center">
                {typeof box.price === 'string' ? parseFloat(box.price).toLocaleString('ru-RU') : box.price.toLocaleString('ru-RU')} ₽
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    onAddToCart?.(box);
                  }}
                  className="flex-1 border border-black text-black py-3 font-semibold tracking-wide hover:bg-black hover:text-white transition-colors flex items-center justify-center gap-2 rounded-xl"
                  data-testid={`button-add-to-cart-${box.id}`}
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
                  data-testid={`button-details-${box.id}`}
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