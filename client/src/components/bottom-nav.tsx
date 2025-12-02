import { useLocation } from "wouter";
import kavaraLogo from "@assets/Vector (2)_1762347061448.png";
import { useTelegram } from "@/hooks/use-telegram";

import Vector__2_ from "@assets/Vector (2).png";

const menuItems = [
  { path: "/info", label: "INFO" },
  { path: "/", label: "ГЛАВНАЯ", isLogo: true },
  { path: "/profile", label: "ПРОФИЛЬ" },
];

export default function BottomNav() {
  const [location, setLocation] = useLocation();
  const { hapticFeedback } = useTelegram();

  const shouldShowBlackBg = 
    location === "/catalog" || 
    location.startsWith("/catalog") ||
    location === "/boxes" ||
    location.startsWith("/boxes") ||
    location.startsWith("/product/") ||
    location === "/cart" ||
    location.startsWith("/cart") ||
    location === "/favorites" ||
    location.startsWith("/favorites") ||
    location === "/profile" ||
    location.startsWith("/profile") ||
    location === "/info" ||
    location.startsWith("/info") ||
    location === "/order" ||
    location.startsWith("/order");
  const bgClass = shouldShowBlackBg ? "bg-black" : "";

  return (
    <div className={`fixed bottom-0 left-0 right-0 w-full py-4 z-[100] pb-safe ${bgClass}`}>
      <div className="flex items-center justify-center">
        {menuItems.map((item) => {
          const isActive = location === item.path || 
            (item.path !== "/" && location.startsWith(item.path));

          return (
            <button
              key={item.path}
              onClick={() => {
                hapticFeedback.impact('light');
                setLocation(item.path);
              }}
              className={`flex items-center justify-center w-24 h-10 transition-colors ${
                isActive 
                  ? "text-white" 
                  : "text-white/70 hover:text-white"
              }`}
              data-testid={`button-nav-${item.path === "/" ? "home" : item.path === "/info" ? "info" : "profile"}`}
            >
              {item.isLogo ? (
                <img 
                  src={Vector__2_} 
                  alt="KAVARA Logo" 
                  className={`w-6 h-6 object-contain ${isActive ? "opacity-100" : "opacity-70"}`}
                />
              ) : (
                <span className={`text-xs font-bold tracking-wide ${
                  isActive ? "text-white" : "text-white/70"
                }`}>
                  {item.label}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}