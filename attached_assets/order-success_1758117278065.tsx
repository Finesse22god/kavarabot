import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import type { Order } from "@shared/schema";

export default function OrderSuccess() {
  const [, setLocation] = useLocation();
  const [order, setOrder] = useState<Order | null>(null);

  useEffect(() => {
    const stored = sessionStorage.getItem("lastOrder");
    if (stored) {
      setOrder(JSON.parse(stored));
    } else {
      setLocation("/");
    }
  }, [setLocation]);

  const handleActivityClick = (activity: string) => {
    switch (activity) {
      case "other-boxes":
        setLocation("/ready-boxes");
        break;
      case "invite-friend":
        window.open('https://t.me/share/url?url=https://t.me/kavaraappbot&text=Попробуй KAVARA - персональный подбор спортивной одежды! Скидка 10% для новых пользователей', '_blank');
        break;
      case "workout-together":
        window.open('https://t.me/kavarabrand', '_blank');
        break;
      default:
        setLocation("/");
    }
  };

  if (!order) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Загрузка...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="p-4 bg-gradient-to-br from-green-400 to-blue-500 text-white text-center">
        <div className="py-8">
          <div className="text-6xl mb-4">🎉</div>
          <h2 className="text-2xl font-bold mb-2">Заказ оформлен!</h2>
          <p className="text-lg">
            Номер: <span className="font-bold">#{order.orderNumber}</span>
          </p>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Activities */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="font-semibold mb-4">Что дальше?</h3>
          <div className="space-y-3">
            <button 
              className="w-full p-4 border border-gray-300 rounded-lg text-left hover:border-primary hover:bg-primary/5 flex items-center space-x-3 transition-all"
              onClick={() => handleActivityClick("other-boxes")}
            >
              <span className="text-xl">📦</span>
              <span>Другие боксы KAVARA</span>
            </button>
            <button 
              className="w-full p-4 border border-gray-300 rounded-lg text-left hover:border-primary hover:bg-primary/5 flex items-center space-x-3 transition-all"
              onClick={() => handleActivityClick("invite-friend")}
            >
              <span className="text-xl">👥</span>
              <span>Пригласить друга (-10% каждому)</span>
            </button>
            <button 
              className="w-full p-4 border border-gray-300 rounded-lg text-left hover:border-primary hover:bg-primary/5 flex items-center space-x-3 transition-all"
              onClick={() => handleActivityClick("workout-together")}
            >
              <span className="text-xl">🏃‍♂️</span>
              <span>Потренить вместе</span>
            </button>
            <button 
              className="w-full p-4 border border-gray-300 rounded-lg text-left hover:border-primary hover:bg-primary/5 flex items-center space-x-3 transition-all"
              onClick={() => handleActivityClick("join-community")}
            >
              <span className="text-xl">🏆</span>
              <span>КАВАРАКЛАН (сообщество)</span>
            </button>
          </div>
        </div>

        <Button 
          className="w-full bg-primary text-white" 
          onClick={() => setLocation("/")}
        >
          Вернуться на главную
        </Button>
      </div>
    </div>
  );
}
