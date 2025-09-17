import { Home, ShoppingBag, User, Heart, HelpCircle } from "lucide-react";
import { Link, useLocation } from "wouter";

const navigation = [
  { name: "Главная", href: "/", icon: Home },
  { name: "Каталог", href: "/catalog", icon: ShoppingBag },
  { name: "Избранное", href: "/favorites", icon: Heart },
  { name: "О нас", href: "/about", icon: HelpCircle },
  { name: "Профиль", href: "/profile", icon: User },
];

export default function BottomNav() {
  const [location] = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
      <div className="flex justify-around py-2">
        {navigation.map((item) => {
          const isActive = location === item.href;
          const Icon = item.icon;
          
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex flex-col items-center py-2 px-1 min-w-0 ${
                isActive 
                  ? "text-primary" 
                  : "text-gray-500 hover:text-gray-700"
              }`}
              data-testid={`nav-${item.href.slice(1) || 'home'}`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-xs mt-1 text-center leading-tight">
                {item.name}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}