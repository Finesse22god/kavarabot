import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle, Package, Home, MessageCircle, User } from "lucide-react";
import type { Order, Box } from "@shared/schema";

export default function PaymentSuccess() {
  const [, setLocation] = useLocation();
  const [order, setOrder] = useState<Order | null>(null);
  const [box, setBox] = useState<Box | null>(null);

  const contactManager = () => {
    // Open Telegram chat with manager directly in Telegram
    if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
      window.Telegram.WebApp.openTelegramLink("https://t.me/kavarateam");
    } else {
      // Fallback for non-Telegram environment
      window.open("https://t.me/kavarateam", "_blank");
    }
  };

  useEffect(() => {
    // Parse URL parameters to check if this is a YooMoney callback
    const urlParams = new URLSearchParams(window.location.search);
    const label = urlParams.get('label'); // YooMoney payment label
    const operation_id = urlParams.get('operation_id');
    
    if (label || operation_id) {
      // This is a YooMoney callback, update order status
      updateOrderStatusFromPayment(label || operation_id);
    }
    
    const orderData = sessionStorage.getItem("currentOrder");
    const boxData = sessionStorage.getItem("selectedBox");
    
    if (orderData && boxData) {
      setOrder(JSON.parse(orderData));
      setBox(JSON.parse(boxData));
    } else {
      setLocation("/");
    }
  }, [setLocation]);

  const updateOrderStatusFromPayment = async (paymentLabel: string | null) => {
    if (!paymentLabel) return;
    
    try {
      // Update order status to paid
      await fetch(`/api/orders/update-status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderNumber: paymentLabel,
          status: 'paid'
        })
      });
    } catch (error) {
      console.error('Error updating order status:', error);
    }
  };

  if (!order || !box) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="p-4 bg-green-600 text-white">
        <div className="flex items-center justify-center space-x-3">
          <CheckCircle className="w-8 h-8" />
          <div className="text-center">
            <h2 className="font-semibold text-lg">Оплата прошла успешно!</h2>
            <p className="text-sm text-green-100">Ваш заказ принят в обработку</p>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Success Message */}
        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-6 text-center space-y-4">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <Package className="w-8 h-8 text-green-600" />
            </div>
            <div>
              <h3 className="font-semibold text-lg mb-2">
                Спасибо за покупку!
              </h3>
              <p className="text-gray-600 mb-4">
                Ваш заказ <span className="font-semibold">#{order.orderNumber}</span> успешно оплачен и передан в обработку.
              </p>
              <div className="bg-white rounded-lg p-4 text-left">
                <div className="flex items-center space-x-4">
                  <img 
                    src={box.imageUrl} 
                    alt={box.name}
                    className="w-16 h-16 rounded-lg object-cover"
                  />
                  <div className="flex-1">
                    <h4 className="font-semibold">{box.name}</h4>
                    <p className="text-sm text-gray-600">{box.description}</p>
                    <p className="font-bold text-primary mt-1">
                      {order.totalPrice}₽
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Order Details */}
        <Card>
          <CardContent className="p-6 space-y-4">
            <h3 className="font-semibold mb-4">Детали заказа</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Номер заказа:</span>
                <span className="font-semibold">#{order.orderNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Получатель:</span>
                <span>{order.customerName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Телефон:</span>
                <span>{order.customerPhone}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Доставка:</span>
                <span>
                  {order.deliveryMethod === 'courier' ? 'Курьер' : 
                   order.deliveryMethod === 'pickup' ? 'Самовывоз' : 
                   order.deliveryMethod === 'cdek' ? 'СДЭК' : 'Почта'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Статус:</span>
                <span className="text-green-600 font-medium">Оплачен</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Next Steps */}
        <Card>
          <CardContent className="p-6">
            <h3 className="font-semibold mb-4">Что дальше?</h3>
            <div className="space-y-3 text-sm">
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-blue-600 text-xs font-bold">1</span>
                </div>
                <div>
                  <p className="font-medium">Обработка заказа</p>
                  <p className="text-gray-600">В течение 1-2 рабочих дней мы подготовим ваш заказ</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-blue-600 text-xs font-bold">2</span>
                </div>
                <div>
                  <p className="font-medium">Отправка</p>
                  <p className="text-gray-600">Мы отправим уведомление с трек-номером</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-blue-600 text-xs font-bold">3</span>
                </div>
                <div>
                  <p className="font-medium">Получение</p>
                  <p className="text-gray-600">Получите свой персональный бокс KAVARA</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Manager Contact Section */}
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-6 text-center space-y-4">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
              <MessageCircle className="w-8 h-8 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-lg mb-2">
                С вами свяжется менеджер
              </h3>
              <p className="text-gray-600 mb-4">
                Наш менеджер скоро свяжется с вами для уточнения деталей доставки и ответит на все ваши вопросы.
              </p>
              <Button 
                onClick={contactManager}
                className="bg-blue-600 hover:bg-blue-700 text-white"
                size="lg"
              >
                <User className="w-5 h-5 mr-2" />
                Написать менеджеру
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="space-y-3">
          <Button 
            onClick={() => setLocation("/my-orders")}
            className="w-full bg-primary text-white"
            size="lg"
          >
            <Package className="w-5 h-5 mr-2" />
            Мои заказы
          </Button>
          <Button 
            onClick={() => setLocation("/")}
            variant="outline"
            className="w-full"
            size="lg"
          >
            <Home className="w-5 h-5 mr-2" />
            На главную
          </Button>
        </div>
      </div>
    </div>
  );
}