import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { ArrowLeft, Package, Clock, CheckCircle, Truck, RefreshCw, CreditCard, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useTelegram } from "@/hooks/use-telegram";
import { useToast } from "@/hooks/use-toast";
import type { Order, Box, Product } from "@shared/schema";

// Component to display order items (box or individual products)
function OrderItems({ order }: { order: Order }) {
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
            
            {/* Box Contents Details */}
            {box.contents && (() => {
              // Check if contents is already an array
              if (Array.isArray(box.contents) && box.contents.length > 0) {
                return (
                  <div className="mt-3 p-2 bg-white rounded border">
                    <p className="text-xs font-medium text-gray-600 mb-2">
                      Содержимое бокса:
                    </p>
                    <div className="space-y-1">
                      {box.contents.map((item: any, idx: number) => (
                        <div key={idx} className="text-xs text-gray-600">
                          • {item.name || item.title || `Товар ${idx + 1}`}
                          {item.brand && ` (${item.brand})`}
                          {item.size && ` - размер ${item.size}`}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              }
              
              // Try to parse as JSON string
              if (typeof box.contents === 'string') {
                try {
                  const contents = JSON.parse(box.contents);
                  if (Array.isArray(contents) && contents.length > 0) {
                    return (
                      <div className="mt-3 p-2 bg-white rounded border">
                        <p className="text-xs font-medium text-gray-600 mb-2">
                          Содержимое бокса:
                        </p>
                        <div className="space-y-1">
                          {contents.map((item: any, idx: number) => (
                            <div key={idx} className="text-xs text-gray-600">
                              • {item.name || item.title || `Товар ${idx + 1}`}
                              {item.brand && ` (${item.brand})`}
                              {item.size && ` - размер ${item.size}`}
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  }
                } catch (error) {
                  // If JSON parsing fails, show as text
                  return (
                    <div className="mt-3 p-2 bg-white rounded border">
                      <p className="text-xs font-medium text-gray-600 mb-1">
                        Содержимое:
                      </p>
                      <p className="text-xs text-gray-600">{box.contents}</p>
                    </div>
                  );
                }
              }
              
              return null;
            })()}
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
            {order.selectedSize && (
              <p className="text-sm text-gray-500 mt-1">
                Размер: {order.selectedSize}
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
              <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center overflow-hidden">
                {item.imageUrl ? (
                  <img 
                    src={item.imageUrl} 
                    alt={item.name || `Товар ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Package className="w-6 h-6 text-gray-400" />
                )}
              </div>
              <div className="flex-1">
                <h4 className="font-medium">{item.name || `Товар ${index + 1}`}</h4>
                {item.description && (
                  <p className="text-gray-600 text-sm">{item.description}</p>
                )}
                
                {/* Additional product details */}
                <div className="text-sm text-gray-500 space-y-1 mt-2">
                  {item.brand && (
                    <div>Бренд: {item.brand}</div>
                  )}
                  {item.color && (
                    <div>Цвет: {item.color}</div>
                  )}
                  {item.category && (
                    <div>Категория: {item.category}</div>
                  )}
                  {item.selectedSize && (
                    <div>Размер: {item.selectedSize}</div>
                  )}
                </div>
                
                <div className="flex items-center justify-between mt-3">
                  <span className="text-sm text-gray-500">
                    Количество: {item.quantity || 1}
                  </span>
                  <span className="font-medium text-sm">
                    {item.price ? `${Number(item.price).toLocaleString('ru-RU')}₽` : ''}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* No items found */}
      {!box && !product && (!cartItems || cartItems.length === 0) && (
        <div className="text-center py-8">
          <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">
            Информация о составе заказа недоступна
          </p>
        </div>
      )}
    </div>
  );
}

export default function OrderDetails() {
  const [, setLocation] = useLocation();
  const { user, isInTelegram } = useTelegram();
  const { toast } = useToast();
  const [orderNumber, setOrderNumber] = useState<string | null>(null);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const order = urlParams.get("order");
    setOrderNumber(order);
  }, []);

  const { data: order, isLoading, error, refetch } = useQuery({
    queryKey: [`/api/orders/number/${orderNumber}`],
    queryFn: async () => {
      const response = await fetch(`/api/orders/number/${orderNumber}`);
      if (!response.ok) throw new Error("Failed to fetch order");
      return response.json() as Promise<Order>;
    },
    enabled: !!orderNumber,
  });

  // Payment mutation
  const paymentMutation = useMutation({
    mutationFn: async (order: Order) => {
      const response = await fetch("/api/create-payment-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: order.totalPrice,
          description: `Заказ ${order.orderNumber}`,
          orderId: order.id,
          returnUrl: `https://t.me/kavaraappbot/app?startapp=payment_success`
        }),
      });

      if (!response.ok) throw new Error("Failed to create payment");
      return response.json();
    },
    onSuccess: (paymentIntent, order) => {
      // Redirect to payment URL
      window.open(paymentIntent.paymentUrl, '_blank');
      toast({
        title: "Переход к оплате",
        description: `Заказ ${order.orderNumber} ожидает оплаты`,
      });
    },
    onError: (error) => {
      toast({
        title: "Ошибка оплаты",
        description: "Не удалось создать платеж. Попробуйте позже.",
        variant: "destructive",
      });
    },
  });

  // Calculate order total as fallback if server doesn't have it
  const calculateOrderTotal = (order: Order) => {
    if (order.totalPrice && order.totalPrice > 0) {
      return order.totalPrice;
    }

    let total = 0;
    
    // Try to calculate from cart items first
    if (order.cartItems) {
      try {
        const items = JSON.parse(order.cartItems);
        total = items.reduce((sum: number, item: any) => {
          return sum + ((item.price || 0) * (item.quantity || 1));
        }, 0);
        if (total > 0) return total;
      } catch (error) {
        console.error('Error parsing cart items:', error);
      }
    }
    
    // Fallback calculation - this should be handled by the server now
    console.warn('Order total not available, server should calculate this');
    
    // Return 0 if no total found - server should calculate this
    return 0;
  };

  const handlePayment = (order: Order) => {
    const orderTotal = calculateOrderTotal(order);
    
    if (!orderTotal || orderTotal <= 0) {
      toast({
        title: "Ошибка",
        description: "Не удается определить стоимость заказа. Обратитесь в поддержку.",
        variant: "destructive",
      });
      return;
    }
    
    // Show confirmation before payment
    if (window.confirm(`Оплатить заказ ${order.orderNumber} на сумму ${orderTotal.toLocaleString('ru-RU')}₽?`)) {
      // Use calculated total for payment
      const orderWithTotal = { ...order, totalPrice: orderTotal };
      paymentMutation.mutate(orderWithTotal);
    }
  };

  const getStatusIcon = (status: string | null) => {
    switch (status) {
      case "pending": return <Clock className="w-5 h-5 text-orange-500" />;
      case "paid": return <CheckCircle className="w-5 h-5 text-green-600" />;
      case "processing": return <Package className="w-5 h-5 text-blue-500" />;
      case "shipped": return <Truck className="w-5 h-5 text-purple-500" />;
      case "delivered": return <CheckCircle className="w-5 h-5 text-green-500" />;
      default: return <Clock className="w-5 h-5 text-gray-500" />;
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

  // Check authentication
  if (!isInTelegram || !user) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-black mb-4">Доступ запрещен</h1>
          <p className="text-gray-600 mb-6">
            Детали заказов доступны только пользователям Telegram
          </p>
          <Button onClick={() => window.location.href = "/"}>На главную</Button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Загружаем детали заказа...</p>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-black mb-4">Заказ не найден</h2>
          <p className="text-gray-600 mb-6">
            Заказ с номером #{orderNumber} не найден или у вас нет доступа к нему
          </p>
          <div className="space-y-3">
            <Button onClick={() => setLocation("/my-orders")}>
              Мои заказы
            </Button>
            <Button 
              variant="outline"
              onClick={() => setLocation("/")}
            >
              На главную
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="p-4 bg-black text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <button onClick={() => setLocation("/my-orders")}>
              <ArrowLeft className="w-6 h-6" />
            </button>
            <div>
              <h2 className="font-semibold">Заказ #{order.orderNumber}</h2>
              <p className="text-sm text-gray-300">
                {new Date(order.createdAt || '').toLocaleDateString('ru-RU')}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => refetch()}
            className="text-white hover:bg-white/20"
          >
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Order Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Статус заказа</span>
              <Badge className={getStatusColor(order.status)}>
                <div className="flex items-center space-x-1">
                  {getStatusIcon(order.status)}
                  <span>{getStatusText(order.status)}</span>
                </div>
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-gray-600">Номер заказа:</span>
                <span className="font-medium">#{order.orderNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Дата создания:</span>
                <span>{new Date(order.createdAt || '').toLocaleDateString('ru-RU', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Общая сумма:</span>
                <span className="font-bold text-lg">{calculateOrderTotal(order).toLocaleString('ru-RU')}₽</span>
              </div>
            </div>
            
            {/* Payment Button for Pending Orders */}
            {order.status === "pending" && (
              <div className="mt-4 pt-4 border-t">
                <div className="space-y-3">
                  <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-sm text-yellow-800 font-medium">
                      💳 Заказ ожидает оплаты
                    </p>
                    <p className="text-xs text-yellow-600 mt-1">
                      Завершите оплату, чтобы мы начали обработку вашего заказа
                    </p>
                  </div>
                  <Button
                    onClick={() => handlePayment(order)}
                    disabled={paymentMutation.isPending}
                    className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3"
                    size="lg"
                    data-testid={`button-pay-order-details-${order.orderNumber}`}
                  >
                    <CreditCard className="w-5 h-5 mr-2" />
                    {paymentMutation.isPending ? (
                      <>
                        <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                        Создание платежа...
                      </>
                    ) : (
                      `Оплатить ${calculateOrderTotal(order).toLocaleString('ru-RU')}₽`
                    )}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Customer Information */}
        <Card>
          <CardHeader>
            <CardTitle>Информация о покупателе</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Имя:</span>
                <span>{order.customerName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Телефон:</span>
                <span>{order.customerPhone}</span>
              </div>
              {order.customerEmail && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Email:</span>
                  <span>{order.customerEmail}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Delivery Information */}
        <Card>
          <CardHeader>
            <CardTitle>Доставка и оплата</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Способ доставки:</span>
                <span>
                  {order.deliveryMethod === 'courier' ? 'Курьер по Москве' : 
                   order.deliveryMethod === 'pickup' ? 'Самовывоз' : 
                   order.deliveryMethod === 'cdek' ? 'СДЭК' : 
                   order.deliveryMethod || 'Не указан'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Способ оплаты:</span>
                <span>
                  {order.paymentMethod === 'card' ? 'Банковская карта' : 
                   order.paymentMethod === 'cash' ? 'Наличными при получении' : 
                   order.paymentMethod || 'Не указан'}
                </span>
              </div>
              {order.deliveryAddress && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Адрес доставки:</span>
                  <span>{order.deliveryAddress}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Order Items */}
        <Card>
          <CardHeader>
            <CardTitle>Состав заказа</CardTitle>
          </CardHeader>
          <CardContent>
            <OrderItems order={order} />
          </CardContent>
        </Card>

        {/* Order Timeline */}
        <Card>
          <CardHeader>
            <CardTitle>История заказа</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                <div>
                  <p className="font-medium">Заказ создан</p>
                  <p className="text-sm text-gray-600">
                    {new Date(order.createdAt || '').toLocaleDateString('ru-RU', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
              </div>
              
              {order.status !== 'pending' && (
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                  <div>
                    <p className="font-medium">
                      {order.status === 'paid' ? 'Заказ оплачен' :
                       order.status === 'processing' ? 'Заказ в обработке' :
                       order.status === 'shipped' ? 'Заказ отправлен' :
                       order.status === 'delivered' ? 'Заказ доставлен' :
                       'Статус изменен'}
                    </p>
                    <p className="text-sm text-gray-600">
                      {order.updatedAt ? new Date(order.updatedAt).toLocaleDateString('ru-RU', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      }) : 'Дата не указана'}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Contact Support */}
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-6 text-center">
            <h3 className="font-semibold text-lg mb-2">Нужна помощь?</h3>
            <p className="text-gray-600 mb-4">
              Если у вас есть вопросы по заказу, свяжитесь с нашей поддержкой
            </p>
            <Button 
              onClick={() => window.open('https://t.me/kavarateam', '_blank')}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              Написать в поддержку
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}