import { useLocation } from "wouter";
import { Home, ShoppingCart, User, ShoppingBag } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useTelegram } from "@/hooks/use-telegram";

const menuItems = [
  { path: "/", icon: Home, label: "ГЛАВНАЯ" },
  { path: "/catalog", icon: ShoppingBag, label: "КАТАЛОГ" },
  { path: "/cart", icon: ShoppingCart, label: "КОРЗИНА" },
  { path: "/profile", icon: User, label: "ПРОФИЛЬ" },
];

export default function BottomNav() {
  const [location, setLocation] = useLocation();
  const { user: telegramUser } = useTelegram();

  // Get database user by telegram ID
  const { data: dbUser } = useQuery<{ id: string; telegramId: string }>({
    queryKey: [`/api/users/telegram/${telegramUser?.id}`],
    enabled: !!telegramUser?.id
  });

  const { data: cartItems } = useQuery<any[]>({
    queryKey: [`/api/cart/${dbUser?.id}`],
    enabled: !!dbUser?.id,
  });

  const cartItemCount = cartItems?.reduce((sum, item) => sum + item.quantity, 0) || 0;

  return (
    <div className="fixed bottom-0 left-0 right-0 px-2 py-3 max-w-md mx-auto z-[100] pb-safe">
      <div className="flex items-center justify-around">
        {menuItems.map((item) => {
          const isActive = location === item.path || 
            (item.path !== "/" && location.startsWith(item.path));

          const IconComponent = item.icon;

          return (
            <button
              key={item.path}
              onClick={() => setLocation(item.path)}
              className={`flex flex-col items-center space-y-1 px-1 py-1 transition-colors relative ${
                isActive 
                  ? "text-white" 
                  : "text-white/70 hover:text-white"
              }`}
            >
              <div className="relative">
                <IconComponent 
                  className={`w-6 h-6 ${isActive ? "stroke-2" : "stroke-1"}`} 
                />
                {item.path === "/cart" && cartItemCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                    {cartItemCount > 99 ? "99+" : cartItemCount}
                  </span>
                )}
              </div>
              <span className={`text-[10px] font-bold tracking-wide ${
                isActive ? "text-white" : "text-white/70"
              }`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}