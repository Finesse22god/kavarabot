import { useState } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { ArrowLeft, Package, Clock, CheckCircle, Truck, RefreshCw, MessageCircle, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Order } from "@shared/schema";
import { useTelegram } from "@/hooks/use-telegram";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";

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

  const handlePayment = (order: Order) => {
    if (!order.totalPrice || order.totalPrice <= 0) {
      toast({
        title: "Ошибка",
        description: "Отсутствуют данные для оплаты",
        variant: "destructive",
      });
      return;
    }
    paymentMutation.mutate(order);
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
    <div className="bg-white rounded-xl shadow-lg p-4 border border-gray-100">
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className="font-semibold">Заказ #{order.orderNumber}</h3>
          <p className="text-sm text-gray-600">
            {new Date(order.createdAt || '').toLocaleDateString('ru-RU')}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          {getStatusIcon(order.status)}
          <span className="text-sm font-medium">{getStatusText(order.status)}</span>
        </div>
      </div>
      
      <div className="mb-3">
        <p className="text-sm text-gray-600">Клиент: {order.customerName}</p>
        <p className="text-sm text-gray-600">Доставка: {order.deliveryMethod}</p>
        <div className="flex items-center gap-2 mt-2">
          {order.status === "pending" && (
            <Button
              variant="default"
              size="sm"
              onClick={() => handlePayment(order)}
              className="text-xs bg-green-600 hover:bg-green-700"
              disabled={paymentMutation.isPending}
              data-testid={`button-pay-order-${order.orderNumber}`}
            >
              <CreditCard className="w-3 h-3 mr-1" />
              {paymentMutation.isPending ? "Загружается..." : "Оплатить заказ"}
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setLocation("/profile?tab=contacts")}
            className="text-xs"
            data-testid="button-contact-manager-order"
          >
            <MessageCircle className="w-3 h-3 mr-1" />
            Связаться
          </Button>
        </div>
      </div>

      <div className="flex justify-between items-center">
        <span className="text-lg font-bold text-primary">
          {order.totalPrice.toLocaleString('ru-RU')}₽
        </span>
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => setLocation(`/order-details?order=${order.orderNumber}`)}
        >
          Подробнее
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
      <div className="p-4 bg-black text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="text-2xl">📦</div>
            <div>
              <h2 className="font-semibold">Мои заказы</h2>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              queryClient.invalidateQueries({ queryKey: ["/api/orders/user", user?.id] });
              refetch();
            }}
            className="text-white hover:bg-white/20"
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