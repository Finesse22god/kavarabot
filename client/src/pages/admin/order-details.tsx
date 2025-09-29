import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, User, Phone, Mail, MapPin, Package, CreditCard, ShoppingBag } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import type { Box, Product } from "@shared/schema";

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
  productId?: string;
  cartItems?: string;
  selectedSize?: string;
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

// Component to display order items in admin panel
function AdminOrderItems({ order }: { order: Order }) {
  const { data: box } = useQuery<Box>({
    queryKey: [`/api/boxes/${order.boxId}`],
    queryFn: async () => {
      const response = await fetch(`/api/boxes/${order.boxId}`);
      if (!response.ok) throw new Error("Failed to fetch box");
      return response.json();
    },
    enabled: !!order.boxId,
  });

  const { data: product } = useQuery<Product>({
    queryKey: [`/api/products/${order.productId}`],
    queryFn: async () => {
      const response = await fetch(`/api/products/${order.productId}`);
      if (!response.ok) throw new Error("Failed to fetch product");
      return response.json();
    },
    enabled: !!order.productId,
  });

  // Parse cart items if available
  const cartItems = order.cartItems ? JSON.parse(order.cartItems) : null;

  return (
    <div className="space-y-4">
      {/* Single Box Order */}
      {box && (
        <div className="flex items-start space-x-4 p-4 bg-gray-50 rounded-lg">
          <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center overflow-hidden">
            {box.imageUrl ? (
              <img 
                src={box.imageUrl} 
                alt={box.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <ShoppingBag className="w-8 h-8 text-gray-400" />
            )}
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-lg">{box.name}</h3>
            <p className="text-gray-600 text-sm mt-1">{box.description}</p>
            <div className="flex items-center justify-between mt-2">
              <Badge variant="outline" className="text-xs">
                Готовый бокс
              </Badge>
              <span className="font-medium">
                {Number(box.price).toLocaleString('ru-RU')}₽
              </span>
            </div>
            {order.selectedSize && (
              <p className="text-sm text-gray-500 mt-1">
                Размер: {order.selectedSize}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Single Product Order */}
      {product && (
        <div className="flex items-start space-x-4 p-4 bg-gray-50 rounded-lg">
          <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center overflow-hidden">
            {product.imageUrl ? (
              <img 
                src={product.imageUrl} 
                alt={product.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <Package className="w-8 h-8 text-gray-400" />
            )}
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-lg">{product.name}</h3>
            <p className="text-gray-600 text-sm mt-1">{product.description}</p>
            <div className="flex items-center justify-between mt-2">
              <Badge variant="outline" className="text-xs">
                Товар
              </Badge>
              <span className="font-medium">
                {product.price.toLocaleString('ru-RU')}₽
              </span>
            </div>
            {product.brand && (
              <p className="text-sm text-gray-500">
                Бренд: {product.brand}
              </p>
            )}
            {product.color && (
              <p className="text-sm text-gray-500">
                Цвет: {product.color}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Cart Items */}
      {cartItems && cartItems.length > 0 && (
        <div className="space-y-3">
          <p className="text-sm font-medium text-gray-700">
            Товары из корзины ({cartItems.length}):
          </p>
          {cartItems.map((item: any, index: number) => (
            <div key={index} className="flex items-start space-x-4 p-3 bg-gray-50 rounded-lg">
              <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center">
                <Package className="w-6 h-6 text-gray-400" />
              </div>
              <div className="flex-1">
                <h4 className="font-medium">{item.name || `Товар ${index + 1}`}</h4>
                {item.description && (
                  <p className="text-gray-600 text-sm">{item.description}</p>
                )}
                <div className="flex items-center justify-between mt-1">
                  <span className="text-sm text-gray-500">
                    Количество: {item.quantity || 1}
                  </span>
                  <span className="font-medium text-sm">
                    {item.price ? `${item.price}₽` : ''}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Legacy items support */}
      {!box && !product && (!cartItems || cartItems.length === 0) && order.items && order.items.length > 0 && (
        <div className="space-y-3">
          <p className="text-sm font-medium text-gray-700">
            Товары в заказе ({order.items.length}):
          </p>
          {order.items.map((item, index) => (
            <div key={index} className="flex items-start space-x-4 p-3 bg-gray-50 rounded-lg">
              <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center">
                <Package className="w-6 h-6 text-gray-400" />
              </div>
              <div className="flex-1">
                <h4 className="font-medium">{item.name}</h4>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-sm text-gray-500">
                    Количество: {item.quantity}
                  </span>
                  <span className="font-medium text-sm">{item.price}₽</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Legacy box name support */}
      {!box && !product && (!cartItems || cartItems.length === 0) && (!order.items || order.items.length === 0) && order.boxName && (
        <div className="flex items-start space-x-4 p-4 bg-gray-50 rounded-lg">
          <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center">
            <ShoppingBag className="w-8 h-8 text-gray-400" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-lg">{order.boxName}</h3>
            <p className="text-gray-600 text-sm mt-1">Готовый набор KAVARA</p>
            <div className="flex items-center justify-between mt-2">
              <Badge variant="outline" className="text-xs">
                Готовый бокс (legacy)
              </Badge>
              <span className="font-medium">
                {order.totalPrice.toLocaleString('ru-RU')}₽
              </span>
            </div>
          </div>
        </div>
      )}

      {/* No items found */}
      {!box && !product && (!cartItems || cartItems.length === 0) && (!order.items || order.items.length === 0) && !order.boxName && (
        <div className="text-center py-8">
          <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 mb-2">Информация о составе заказа недоступна</p>
          <p className="text-sm text-gray-400">ID заказа: {order.id}</p>
        </div>
      )}
    </div>
  );
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
            <AdminOrderItems order={order} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}