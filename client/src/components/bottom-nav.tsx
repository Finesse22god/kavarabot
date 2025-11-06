import { useLocation } from "wouter";
import { User, Info } from "lucide-react";
import kavaraLogo from "@assets/Vector (2)_1762347061448.png";

const menuItems = [
  { path: "/info", icon: Info, label: "INFO", isLogo: false },
  { path: "/", icon: null, label: "ГЛАВНАЯ", isLogo: true },
  { path: "/profile", icon: User, label: "ПРОФИЛЬ", isLogo: false },
];

export default function BottomNav() {
  const [location, setLocation] = useLocation();

  return (
    <div className="fixed bottom-0 left-0 right-0 px-2 py-3 max-w-md mx-auto z-[100] pb-safe bg-black">
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
              data-testid={`button-nav-${item.path === "/" ? "home" : item.path === "/info" ? "info" : "profile"}`}
            >
              <div className="relative">
                {item.isLogo ? (
                  <img 
                    src={kavaraLogo} 
                    alt="KAVARA Logo" 
                    className={`w-6 h-6 object-contain ${isActive ? "opacity-100" : "opacity-70"}`}
                  />
                ) : IconComponent ? (
                  <IconComponent 
                    className={`w-6 h-6 ${isActive ? "stroke-2" : "stroke-1"}`} 
                  />
                ) : null}
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