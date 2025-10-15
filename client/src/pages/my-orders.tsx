import { useState } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { ArrowLeft, Package, Clock, CheckCircle, Truck, RefreshCw, MessageCircle, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Order } from "@shared/schema";
import { useTelegram } from "@/hooks/use-telegram";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge"; // Assuming Badge is available and used similarly to how it was implied in changes

export default function MyOrders() {
  const { user, isInTelegram } = useTelegram();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: orders, isLoading, refetch } = useQuery({
    queryKey: ["/api/orders/user", user?.id],
    queryFn: async () => {
      const response = await fetch(`/api/orders/user/${user?.id}`);
      if (!response.ok) throw new Error("Failed to fetch orders");
      return response.json() as Promise<Order[]>;
    },
    enabled: !!user?.id,
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
          returnUrl: `https://t.me/kavaraappbot/app?startapp=payment_success` // This URL might need to be dynamic or handled by the backend
        }),
      });

      if (!response.ok) throw new Error("Failed to create payment");
      return response.json();
    },
    onSuccess: (paymentIntent, order) => {
      // Open payment in Telegram's built-in browser for better UX
      if (paymentIntent.paymentUrl) {
        if (window.Telegram?.WebApp) {
          window.Telegram.WebApp.openLink(paymentIntent.paymentUrl, { try_instant_view: true });
        } else {
          window.open(paymentIntent.paymentUrl, '_blank');
        }
      }
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

    // Fallback to box or product price from the order relation
    // Note: We don't have access to box/product here, but the server should handle this
    // If server-side calculation fails, we return the current totalPrice (which might be 0)
    return order.totalPrice || 0;
  };

  const handlePayment = (order: Order) => {
    const orderTotal = calculateOrderTotal(order);

    if (!orderTotal || orderTotal <= 0) {
      toast({
        title: "Ошибка",
        description: "Не удается определить стоимость заказа",
        variant: "destructive",
      });
      return;
    }

    // Use calculated total for payment
    const orderWithTotal = { ...order, totalPrice: orderTotal };
    paymentMutation.mutate(orderWithTotal);
  };

  const currentOrders = orders?.filter(order => 
    order.status === "pending" || order.status === "paid" || order.status === "processing" || order.status === "shipped"
  ) || [];

  const historyOrders = orders?.filter(order => 
    order.status === "delivered" || order.status === "cancelled"
  ) || [];

  const getStatusIcon = (status: string | null) => {
    switch (status) {
      case "pending": return <Clock className="w-4 h-4 text-orange-500" />;
      case "paid": return <CheckCircle className="w-4 h-4 text-green-600" />;
      case "processing": return <Package className="w-4 h-4 text-blue-500" />;
      case "shipped": return <Truck className="w-4 h-4 text-purple-500" />;
      case "delivered": return <CheckCircle className="w-4 h-4 text-green-500" />;
      default: return <Clock className="w-4 h-4 text-gray-500" />;
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

  // Helper for badge color, inferred from original changes implication
  const getStatusColor = (status: string | null) => {
    switch (status) {
      case "pending": return "bg-orange-500 hover:bg-orange-600";
      case "paid": return "bg-green-600 hover:bg-green-700";
      case "processing": return "bg-blue-500 hover:bg-blue-600";
      case "shipped": return "bg-purple-500 hover:bg-purple-600";
      case "delivered": return "bg-green-500 hover:bg-green-600";
      default: return "bg-gray-500 hover:bg-gray-600";
    }
  };


  // Check authentication
  if (!isInTelegram || !user) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-black mb-4">Доступ запрещен</h1>
          <p className="text-gray-600 mb-6">
            Заказы доступны только пользователям Telegram
          </p>
          <Button onClick={() => window.location.href = "/"}>На главную</Button>
        </div>
      </div>
    );
  }

  const OrderCard = ({ order }: { order: Order }) => (
    <div className="bg-white rounded-2xl shadow-sm p-4 border border-gray-100">
      <div className="flex justify-between items-start mb-2">
        <div>
          <h3 className="font-bold text-lg">Заказ #{order.orderNumber}</h3>
          <p className="text-sm text-gray-500">
            {new Date(order.createdAt || '').toLocaleDateString('ru-RU')}
          </p>
        </div>
        <div className="flex items-center space-x-1">
          {getStatusIcon(order.status)}
          <span className="text-sm font-medium">{getStatusText(order.status)}</span>
        </div>
      </div>

      <div className="mb-3">
        <p className="text-sm text-gray-700">Клиент: {order.customerName}</p>
        <p className="text-sm text-gray-700">Доставка: {order.deliveryMethod}</p>
      </div>

      <div className="mb-3">
        <Button
          variant="outline"
          size="sm"
          onClick={() => window.open("https://t.me/kavarabrand", "_blank")}
          className="text-sm w-full"
          data-testid="button-contact-manager"
        >
          <MessageCircle className="w-4 h-4 mr-2" />
          Связаться
        </Button>
      </div>

      <div className="flex justify-between items-center pt-2 border-t border-gray-100">
        <span className="text-xl font-bold">
          {calculateOrderTotal(order).toLocaleString('ru-RU')}₽
        </span>
        <Button 
          variant="ghost" 
          size="sm"
          onClick={() => {
            setLocation(`/order-details?order=${order.orderNumber}`);
          }}
          className="text-sm font-medium"
          data-testid={`button-details-${order.orderNumber}`}
        >
          Детали
        </Button>
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center pb-20">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Загружаем заказы...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="p-4 bg-white border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Package className="w-6 h-6 text-orange-500" />
            <h2 className="font-semibold text-lg">Мои заказы</h2>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              queryClient.invalidateQueries({ queryKey: ["/api/orders/user", user?.id] });
              refetch();
            }}
            className="text-gray-600 hover:bg-gray-100"
          >
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="p-4">
        <Tabs defaultValue="current" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="current">Текущие заказы</TabsTrigger>
            <TabsTrigger value="history">История</TabsTrigger>
          </TabsList>

          <TabsContent value="current" className="mt-4 space-y-4">
            {currentOrders.length > 0 ? (
              currentOrders.map((order) => (
                <OrderCard key={order.id} order={order} />
              ))
            ) : (
              <div className="text-center py-8">
                <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">Нет текущих заказов</p>
                <p className="text-sm text-gray-500 mt-1">
                  Оформите свой первый заказ!
                </p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="history" className="mt-4 space-y-4">
            {historyOrders.length > 0 ? (
              historyOrders.map((order) => (
                <OrderCard key={order.id} order={order} />
              ))
            ) : (
              <div className="text-center py-8">
                <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">История заказов пуста</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}