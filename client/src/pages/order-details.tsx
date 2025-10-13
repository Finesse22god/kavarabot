import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { ArrowLeft, CheckCircle, MessageCircle, User, Package, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useTelegram } from "@/hooks/use-telegram";
import type { Order } from "@shared/schema";

export default function OrderDetails() {
  const [, setLocation] = useLocation();
  const { user, isInTelegram } = useTelegram();
  const [orderNumber, setOrderNumber] = useState<string | null>(null);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const order = urlParams.get("order");
    setOrderNumber(order);
  }, []);

  const { data: order, isLoading } = useQuery({
    queryKey: [`/api/orders/number/${orderNumber}`],
    queryFn: async () => {
      const response = await fetch(`/api/orders/number/${orderNumber}`);
      if (!response.ok) throw new Error("Failed to fetch order");
      return response.json() as Promise<Order>;
    },
    enabled: !!orderNumber,
  });

  const contactManager = () => {
    // Open Telegram chat with manager directly in Telegram
    if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
      window.Telegram.WebApp.openTelegramLink("https://t.me/kavarateam");
    } else {
      // Fallback for non-Telegram environment
      window.open("https://t.me/kavarateam", "_blank");
    }
  };

  const getStatusText = (status: string | null) => {
    switch (status) {
      case "pending": return "Ожидает оплаты";
      case "paid": return "Оплачен";
      case "processing": return "В работе";
      case "shipped": return "В пути";
      case "delivered": return "Доставлен";
      case "cancelled": return "Отменен";
      default: return "Неизвестно";
    }
  };

  const getDeliveryText = (method: string | null) => {
    switch (method) {
      case "courier": return "Курьер";
      case "pickup": return "Самовывоз";
      case "cdek": return "cdek";
      case "post": return "Почта";
      default: return method || "Не указан";
    }
  };

  if (!isInTelegram || !user) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-black mb-4">Доступ запрещен</h1>
          <p className="text-gray-600 mb-6">
            Детали заказов доступны только пользователям Telegram
          </p>
          <Button onClick={() => setLocation("/")}>На главную</Button>
        </div>
      </div>
    );
  }

  if (isLoading || !order) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Загружаем детали заказа...</p>
        </div>
      </div>
    );
  }

  const formatDate = (dateStr: string | Date | null | undefined) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('ru-RU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }) + ' в ' + date.toLocaleTimeString('ru-RU', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Success Banner for Paid Orders */}
      {order.status === 'paid' && (
        <div className="p-4 bg-green-600 text-white">
          <div className="flex items-center justify-center space-x-3">
            <CheckCircle className="w-8 h-8" />
            <div className="text-center">
              <h2 className="font-semibold text-lg">Заказ оплачен!</h2>
              <p className="text-sm text-green-100">Менеджер свяжется с вами</p>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="p-4 bg-black text-white">
        <div className="flex items-center space-x-3">
          <button 
            onClick={() => setLocation("/my-orders")}
            data-testid="button-back"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div>
            <h2 className="font-semibold">Заказ #{order.orderNumber}</h2>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Order Details Card */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold">Детали заказа</h3>
              {order.status === 'paid' && (
                <div className="bg-black text-white px-3 py-1 rounded text-sm font-medium">
                  Оплачен
                </div>
              )}
            </div>

            <div className="space-y-4">
              {/* Order Information Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Номер заказа</p>
                  <p className="font-semibold" data-testid="text-order-number">#{order.orderNumber}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Дата заказа</p>
                  <p className="font-medium" data-testid="text-order-date">
                    {formatDate(order.createdAt)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Сумма заказа</p>
                  <p className="font-semibold" data-testid="text-order-total">
                    {order.totalPrice?.toLocaleString('ru-RU')}₽
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Способ доставки</p>
                  <p className="font-medium" data-testid="text-delivery-method">
                    {getDeliveryText(order.deliveryMethod)}
                  </p>
                </div>
              </div>

              {/* Contact Information */}
              <div className="pt-4 border-t">
                <p className="text-sm text-gray-600 mb-3">Контактные данные</p>
                <div className="space-y-2">
                  <div>
                    <span className="font-semibold">Имя: </span>
                    <span data-testid="text-customer-name">{order.customerName}</span>
                  </div>
                  <div>
                    <span className="font-semibold">Телефон: </span>
                    <span data-testid="text-customer-phone">{order.customerPhone}</span>
                  </div>
                  {order.customerEmail && (
                    <div>
                      <span className="font-semibold">Email: </span>
                      <span data-testid="text-customer-email">{order.customerEmail}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Manager Contact Card */}
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-6 text-center space-y-4">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
              <MessageCircle className="w-8 h-8 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-lg mb-2">
                Менеджер свяжется с вами
              </h3>
              <p className="text-gray-700 mb-4">
                Наш менеджер скоро свяжется с вами для уточнения деталей доставки и ответит на все ваши вопросы.
              </p>
              <Button 
                onClick={contactManager}
                className="bg-blue-600 hover:bg-blue-700 text-white"
                size="lg"
                data-testid="button-contact-manager"
              >
                <User className="w-5 h-5 mr-2" />
                Связаться с менеджером
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="space-y-3">
          <Button 
            onClick={() => setLocation("/my-orders")}
            className="w-full bg-black hover:bg-gray-800 text-white"
            size="lg"
            data-testid="button-my-orders"
          >
            <Package className="w-5 h-5 mr-2" />
            Мои заказы
          </Button>
          <Button 
            onClick={() => setLocation("/")}
            variant="outline"
            className="w-full"
            size="lg"
            data-testid="button-home"
          >
            <Home className="w-5 h-5 mr-2" />
            На главную
          </Button>
        </div>
      </div>
    </div>
  );
}
