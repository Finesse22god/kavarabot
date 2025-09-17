import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Package, Clock, CheckCircle, Truck, XCircle, MapPin, Phone, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { apiRequest } from "@/lib/queryClient";
import type { Order } from "@shared/schema";

export default function OrderDetails() {
  const [, setLocation] = useLocation();
  const [orderNumber, setOrderNumber] = useState<string>("");

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const orderNumberParam = urlParams.get('order');
    if (orderNumberParam) {
      setOrderNumber(orderNumberParam);
    } else {
      setLocation("/my-orders");
    }
  }, [setLocation]);

  const { data: order, isLoading } = useQuery({
    queryKey: ["/api/orders/number", orderNumber],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/orders/number/${orderNumber}`);
      return response.json() as Promise<Order & { box: any }>;
    },
    enabled: !!orderNumber,
  });

  const getStatusIcon = (status: string | null) => {
    switch (status) {
      case "pending": return <Clock className="w-6 h-6 text-orange-500" />;
      case "paid": return <CheckCircle className="w-6 h-6 text-green-500" />;
      case "processing": return <Package className="w-6 h-6 text-blue-500" />;
      case "shipped": return <Truck className="w-6 h-6 text-purple-500" />;
      case "delivered": return <CheckCircle className="w-6 h-6 text-green-500" />;
      case "cancelled": return <XCircle className="w-6 h-6 text-red-500" />;
      default: return <Clock className="w-6 h-6 text-gray-500" />;
    }
  };

  const getStatusText = (status: string | null) => {
    switch (status) {
      case "pending": return "Ожидает оплаты";
      case "paid": return "Оплачен";
      case "processing": return "В обработке";
      case "shipped": return "В пути";
      case "delivered": return "Доставлен";
      case "cancelled": return "Отменен";
      default: return "Неизвестно";
    }
  };

  const getStatusColor = (status: string | null) => {
    switch (status) {
      case "pending": return "bg-orange-100 text-orange-800";
      case "paid": return "bg-green-100 text-green-800";
      case "processing": return "bg-blue-100 text-blue-800";
      case "shipped": return "bg-purple-100 text-purple-800";
      case "delivered": return "bg-green-100 text-green-800";
      case "cancelled": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md text-center">
          <CardContent className="p-6">
            <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Заказ не найден</h2>
            <p className="text-gray-600 mb-4">
              Заказ с номером {orderNumber} не существует или был удален.
            </p>
            <Button onClick={() => setLocation("/my-orders")}>
              Вернуться к заказам
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="px-4 py-3 flex items-center space-x-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLocation("/my-orders")}
            className="p-2"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <h1 className="font-semibold text-lg">Детали заказа</h1>
            <p className="text-sm text-gray-600">#{order.orderNumber}</p>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Status Card */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              {getStatusIcon(order.status)}
              <div className="flex-1">
                <h3 className="font-semibold text-lg">{getStatusText(order.status)}</h3>
                <p className="text-sm text-gray-600">
                  Заказ от {new Date(order.createdAt || '').toLocaleDateString('ru-RU', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>
              <Badge className={getStatusColor(order.status)}>
                {getStatusText(order.status)}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Box Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Package className="w-5 h-5" />
              <span>Товар</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-4">
              <img 
                src={order.box?.imageUrl} 
                alt={order.box?.name}
                className="w-20 h-20 rounded-lg object-cover"
              />
              <div className="flex-1">
                <h4 className="font-semibold text-lg">{order.box?.name}</h4>
                <p className="text-gray-600 text-sm mb-2">{order.box?.description}</p>
                <div className="flex items-center space-x-4">
                  <span className="font-bold text-xl text-primary">
                    {order.totalPrice}₽
                  </span>
                  <span className="text-sm text-gray-500">
                    {order.box?.category === 'ready' ? 'Готовый бокс' : 'Персональный бокс'}
                  </span>
                </div>
              </div>
            </div>
            
            {order.box?.contents && order.box.contents.length > 0 && (
              <div className="mt-4 pt-4 border-t">
                <h5 className="font-medium mb-2">Содержимое бокса:</h5>
                <div className="flex flex-wrap gap-2">
                  {order.box.contents.map((item: string, index: number) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {item}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Customer Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <MapPin className="w-5 h-5" />
              <span>Информация о получателе</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                <Package className="w-5 h-5 text-gray-600" />
              </div>
              <div>
                <p className="font-medium">{order.customerName}</p>
                <p className="text-sm text-gray-600">Получатель</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                <Phone className="w-5 h-5 text-gray-600" />
              </div>
              <div>
                <p className="font-medium">{order.customerPhone}</p>
                <p className="text-sm text-gray-600">Телефон</p>
              </div>
            </div>

            {order.customerEmail && (
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                  <Mail className="w-5 h-5 text-gray-600" />
                </div>
                <div>
                  <p className="font-medium">{order.customerEmail}</p>
                  <p className="text-sm text-gray-600">Email</p>
                </div>
              </div>
            )}

            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                <Truck className="w-5 h-5 text-gray-600" />
              </div>
              <div>
                <p className="font-medium">
                  {order.deliveryMethod === 'courier' ? 'Курьерская доставка' : 
                   order.deliveryMethod === 'pickup' ? 'Самовывоз' : 
                   order.deliveryMethod === 'cdek' ? 'СДЭК' : 'Почта России'}
                </p>
                <p className="text-sm text-gray-600">Способ доставки</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Order Timeline */}
        <Card>
          <CardHeader>
            <CardTitle>История заказа</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                </div>
                <div>
                  <p className="font-medium">Заказ создан</p>
                  <p className="text-sm text-gray-600">
                    {new Date(order.createdAt || '').toLocaleDateString('ru-RU', {
                      day: 'numeric',
                      month: 'long',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
              </div>

              {order.status === 'paid' && (
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  </div>
                  <div>
                    <p className="font-medium">Оплата получена</p>
                    <p className="text-sm text-gray-600">Заказ оплачен</p>
                  </div>
                </div>
              )}

              {order.status === 'pending' && (
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                    <Clock className="w-4 h-4 text-orange-600" />
                  </div>
                  <div>
                    <p className="font-medium">Ожидает оплаты</p>
                    <p className="text-sm text-gray-600">Необходимо завершить оплату</p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="space-y-3 pb-6">
          {order.status === 'pending' && (
            <Button 
              onClick={() => {
                // Preserve order and box data for checkout
                sessionStorage.setItem("currentOrder", JSON.stringify(order));
                if (order.box) {
                  sessionStorage.setItem("selectedBox", JSON.stringify(order.box));
                }
                setLocation("/checkout");
              }}
              className="w-full bg-primary text-white"
              size="lg"
            >
              Завершить оплату
            </Button>
          )}
          
          <Button 
            onClick={() => setLocation("/my-orders")}
            variant="outline"
            className="w-full"
            size="lg"
          >
            Вернуться к заказам
          </Button>
        </div>

        {/* Support */}
        <div className="text-center text-sm text-gray-500 pt-4">
          <p>Есть вопросы о заказе?</p>
          <p>
            <a href="mailto:sales@kavarabrand.com" className="text-primary">
              sales@kavarabrand.com
            </a>
            {" • "}
            <a href="tel:+79251315101" className="text-primary">
              +7 925 131-51-01
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}