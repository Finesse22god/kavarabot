import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, User, Phone, Mail, MapPin, Package, CreditCard } from "lucide-react";

interface Order {
  id: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  status: string;
  totalPrice: number;
  originalPrice?: number;
  deliveryMethod: string;
  deliveryAddress?: string;
  createdAt: string;
  boxId?: string;
  boxName?: string;
  promoCode?: string;
  promoCodeDiscount?: number;
  loyaltyPointsUsed?: number;
  userInfo?: {
    username?: string;
    firstName?: string;
    lastName?: string;
    telegramId?: string;
  };
  items?: Array<{
    name: string;
    quantity: number;
    price: number;
  }>;
}

interface OrderDetailsProps {
  order: Order;
  onBack: () => void;
}

export default function OrderDetails({ order, onBack }: OrderDetailsProps) {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">Ожидает оплаты</Badge>;
      case "paid":
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Оплачен</Badge>;
      case "shipped":
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Отправлен</Badge>;
      case "delivered":
        return <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">Доставлен</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-bold">Заказ #{order.orderNumber}</h1>
        {getStatusBadge(order.status)}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Информация о заказе */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Информация о заказе
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-gray-600">Номер заказа</p>
              <p className="font-semibold">#{order.orderNumber}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Дата создания</p>
              <p className="font-semibold">{new Date(order.createdAt).toLocaleDateString('ru-RU', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Статус</p>
              {getStatusBadge(order.status)}
            </div>
            {/* Скидки и промокоды */}
            {(order.promoCode || order.loyaltyPointsUsed) && (
              <div className="border-t pt-4">
                <p className="text-sm text-gray-600 mb-2">Примененные скидки:</p>
                {order.promoCode && (
                  <div className="flex justify-between items-center mb-2">
                    <div>
                      <p className="text-sm font-medium">Промокод: {order.promoCode}</p>
                      <p className="text-xs text-green-600">Скидка {order.promoCodeDiscount}%</p>
                    </div>
                    <p className="text-sm text-green-600">
                      -{Math.round((order.originalPrice || order.totalPrice) * (order.promoCodeDiscount || 0) / 100)}₽
                    </p>
                  </div>
                )}
                {order.loyaltyPointsUsed && order.loyaltyPointsUsed > 0 && (
                  <div className="flex justify-between items-center mb-2">
                    <p className="text-sm font-medium">Баллы лояльности: {order.loyaltyPointsUsed}</p>
                    <p className="text-sm text-green-600">-{order.loyaltyPointsUsed}₽</p>
                  </div>
                )}
                {order.originalPrice && order.originalPrice !== order.totalPrice && (
                  <div className="flex justify-between items-center">
                    <p className="text-sm text-gray-500 line-through">Первоначальная цена:</p>
                    <p className="text-sm text-gray-500 line-through">{order.originalPrice}₽</p>
                  </div>
                )}
              </div>
            )}
            <div>
              <p className="text-sm text-gray-600">Итоговая сумма</p>
              <p className="text-xl font-bold">{order.totalPrice}₽</p>
            </div>
          </CardContent>
        </Card>

        {/* Информация о клиенте */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Информация о клиенте
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-gray-500" />
              <div>
                <p className="text-sm text-gray-600">Имя</p>
                <p className="font-semibold">{order.customerName}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-gray-500" />
              <div>
                <p className="text-sm text-gray-600">Email</p>
                <p className="font-semibold">{order.customerEmail}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-gray-500" />
              <div>
                <p className="text-sm text-gray-600">Телефон</p>
                <p className="font-semibold">{order.customerPhone}</p>
              </div>
            </div>
            {order.userInfo?.username && (
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 text-gray-500 flex items-center justify-center text-xs font-bold">@</div>
                <div>
                  <p className="text-sm text-gray-600">Telegram</p>
                  <a 
                    href={`https://t.me/${order.userInfo.username}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-semibold text-blue-600 hover:text-blue-800 hover:underline"
                  >
                    @{order.userInfo.username}
                  </a>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Доставка */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Доставка
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-gray-600">Способ доставки</p>
              <p className="font-semibold">
                {order.deliveryMethod === 'delivery' ? 'Доставка курьером' : 'Самовывоз'}
              </p>
            </div>
            {order.deliveryAddress && (
              <div>
                <p className="text-sm text-gray-600">Адрес доставки</p>
                <p className="font-semibold">{order.deliveryAddress}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Состав заказа */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Состав заказа
            </CardTitle>
          </CardHeader>
          <CardContent>
            {order.boxName ? (
              <div className="space-y-3">
                <div className="flex justify-between items-center py-2 border-b">
                  <div>
                    <p className="font-semibold">{order.boxName}</p>
                    <p className="text-sm text-gray-600">Готовый набор KAVARA</p>
                  </div>
                  <p className="font-semibold">{order.totalPrice}₽</p>
                </div>
                <div className="pt-3 border-t">
                  <div className="flex justify-between items-center">
                    <p className="text-lg font-bold">Итого:</p>
                    <p className="text-lg font-bold">{order.totalPrice}₽</p>
                  </div>
                </div>
              </div>
            ) : order.items && order.items.length > 0 ? (
              <div className="space-y-3">
                {order.items.map((item, index) => (
                  <div key={index} className="flex justify-between items-center py-2 border-b last:border-b-0">
                    <div>
                      <p className="font-semibold">{item.name}</p>
                      <p className="text-sm text-gray-600">Количество: {item.quantity}</p>
                    </div>
                    <p className="font-semibold">{item.price}₽</p>
                  </div>
                ))}
                <div className="pt-3 border-t">
                  <div className="flex justify-between items-center">
                    <p className="text-lg font-bold">Итого:</p>
                    <p className="text-lg font-bold">{order.totalPrice}₽</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-gray-500 mb-2">Состав заказа не указан</p>
                <p className="text-sm text-gray-400">ID заказа: {order.id}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}