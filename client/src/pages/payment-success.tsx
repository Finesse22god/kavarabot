import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle, Package, Home, MessageCircle, User, ShoppingBag } from "lucide-react";
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
    
    if (orderData) {
      setOrder(JSON.parse(orderData));
      if (boxData) {
        setBox(JSON.parse(boxData));
      }
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

  // Parse cart items if available
  const getCartItems = () => {
    if (!order?.cartItems) return null;
    try {
      return JSON.parse(order.cartItems);
    } catch {
      return null;
    }
  };

  const cartItems = getCartItems();
  const itemCount = cartItems?.length || (box ? 1 : 0);

  if (!order) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Success Banner */}
      <div className="p-4 bg-green-600 text-white">
        <div className="flex items-center justify-center space-x-3">
          <CheckCircle className="w-8 h-8" />
          <div className="text-center">
            <h2 className="font-semibold text-lg">Заказ оплачен!</h2>
            <p className="text-sm text-green-100">Менеджер свяжется с вами</p>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Success Message Card */}
        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-6 text-center space-y-4">
            {/* Success Icon */}
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>

            {/* Thank you message */}
            <div>
              <h3 className="font-semibold text-xl mb-2">
                Спасибо за покупку!
              </h3>
              <p className="text-gray-700 mb-4">
                Ваш заказ <span className="font-semibold">#{order.orderNumber}</span> успешно оплачен.
              </p>

              {/* Order Items Summary */}
              <div className="bg-white rounded-lg p-4 text-left">
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center">
                    <ShoppingBag className="w-8 h-8 text-gray-400" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold">Товары из корзины</h4>
                    <p className="text-sm text-gray-600">{itemCount} товаров</p>
                    <p className="font-bold text-lg mt-1">
                      {order.totalPrice?.toLocaleString('ru-RU')}₽
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Order Details Card */}
        <Card>
          <CardContent className="p-6">
            <div className="space-y-3 text-base">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Статус:</span>
                <span className="text-green-600 font-semibold flex items-center gap-2">
                  <CheckCircle className="w-5 h-5" />
                  Оплачен
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Номер заказа:</span>
                <span className="font-semibold" data-testid="text-order-number">#{order.orderNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Получатель:</span>
                <span data-testid="text-customer-name">{order.customerName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Телефон:</span>
                <span data-testid="text-customer-phone">{order.customerPhone}</span>
              </div>
              {order.customerEmail && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Email:</span>
                  <span className="text-sm" data-testid="text-customer-email">{order.customerEmail}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-600">Доставка:</span>
                <span data-testid="text-delivery-method">
                  {order.deliveryMethod === 'courier' ? 'Курьер' : 
                   order.deliveryMethod === 'pickup' ? 'Самовывоз' : 
                   order.deliveryMethod === 'cdek' ? 'СДЭК' : 'Почта'}
                </span>
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
