import { ShoppingCart } from "lucide-react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useTelegram } from "@/hooks/use-telegram";

interface CatalogHeaderProps {
  activeTab: "catalog" | "boxes";
}

export default function CatalogHeader({ activeTab }: CatalogHeaderProps) {
  const [, setLocation] = useLocation();
  const { user: telegramUser } = useTelegram();

  // Get database user by telegram ID
  const { data: dbUser } = useQuery<{ id: string; telegramId: string }>({
    queryKey: [`/api/users/telegram/${telegramUser?.id}`],
    enabled: !!telegramUser?.id,
  });

  const { data: cartItems } = useQuery<any[]>({
    queryKey: [`/api/cart/${dbUser?.id}`],
    enabled: !!dbUser?.id,
  });

  const cartItemCount =
    cartItems?.reduce((sum, item) => sum + item.quantity, 0) || 0;

  return (
    <div className="bg-black text-white py-4 px-4 sticky top-0 z-50">
      {/* Logo */}
      <div className="text-center mb-4">
        <h1 className="text-2xl font-bold tracking-widest">KAVARA</h1>
      </div>

      {/* Tab Switcher with Cart Button */}
      <div className="flex items-center justify-between gap-3 h-[30px]">
        {/* Tabs Container */}
        <div className="flex-1 flex items-center border-2 border-white rounded-full overflow-hidden h-[30px]">
          <button
            onClick={() => setLocation("/catalog")}
            className={`flex-1 px-6 text-xs font-bold tracking-wide transition-colors h-full flex items-center justify-center ${
              activeTab === "catalog"
                ? "bg-white text-black"
                : "bg-transparent text-white hover:bg-white/10"
            }`}
            data-testid="button-switch-catalog"
          >
            КАТАЛОГ
          </button>
          <button
            onClick={() => setLocation("/boxes")}
            className={`flex-1 px-6 text-xs font-bold tracking-wide transition-colors h-full flex items-center justify-center ${
              activeTab === "boxes"
                ? "bg-white text-black"
                : "bg-transparent text-white hover:bg-white/10"
            }`}
            data-testid="button-switch-boxes"
          >
            БОКСЫ
          </button>
        </div>

        {/* Cart Button */}
        <button
          onClick={() => setLocation("/cart")}
          className="border-2 border-white rounded-full hover:bg-white/10 transition-colors relative h-[30px] w-[30px] flex items-center justify-center"
          data-testid="button-cart"
        >
          <ShoppingCart className="w-4 h-4 text-white" />
          {cartItemCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
              {cartItemCount > 99 ? "99+" : cartItemCount}
            </span>
          )}
        </button>
      </div>
    </div>
  );
}
