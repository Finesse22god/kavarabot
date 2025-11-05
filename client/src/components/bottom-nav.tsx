import { useLocation } from "wouter";
import { Home, User } from "lucide-react";

const menuItems = [
  { path: "/", icon: Home, label: "ГЛАВНАЯ" },
  { path: "/profile", icon: User, label: "ПРОФИЛЬ" },
];

export default function BottomNav() {
  const [location, setLocation] = useLocation();

  // Черный фон для каталога, боксов, товаров и избранного
  const shouldShowBlackBg = 
    location === "/catalog" || 
    location.startsWith("/catalog") ||
    location === "/boxes" ||
    location.startsWith("/boxes") ||
    location.startsWith("/product/") ||
    location === "/favorites" ||
    location.startsWith("/favorites");
  const bgClass = shouldShowBlackBg ? "bg-black" : "";

  return (
    <div className={`fixed bottom-0 left-0 right-0 px-2 py-3 max-w-md mx-auto z-[100] pb-safe ${bgClass}`}>
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