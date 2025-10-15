import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, CreditCard, ExternalLink } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Order, Box } from "@shared/schema";

interface PaymentIntent {
  id: string;
  amount: number;
  status: 'pending' | 'succeeded' | 'failed';
  paymentUrl?: string;
  description: string;
  orderId: string;
}

export default function Checkout() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [order, setOrder] = useState<Order | null>(null);
  const [box, setBox] = useState<Box | null>(null);
  const [paymentIntent, setPaymentIntent] = useState<PaymentIntent | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreatingPayment, setIsCreatingPayment] = useState(false);

  useEffect(() => {
    const orderData = sessionStorage.getItem("currentOrder");
    const boxData = sessionStorage.getItem("selectedBox");
    
    if (orderData) {
      const parsedOrder = JSON.parse(orderData);
      setOrder(parsedOrder);
      
      // Box data is optional - some orders might not have boxes
      if (boxData) {
        setBox(JSON.parse(boxData));
      }
    } else {
      // No order data - redirect to home
      setLocation("/");
    }
    setIsLoading(false);
  }, [setLocation]);

  const createPayment = async () => {
    if (!order) return;

    setIsCreatingPayment(true);
    try {
      // Prepare description based on order content
      let description = `Оплата заказа ${order.orderNumber}`;
      if (box) {
        description += ` - ${box.name}`;
      } else if (order.cartItems) {
        try {
          const cartItems = JSON.parse(order.cartItems);
          if (cartItems.length > 0) {
            description += ` (${cartItems.length} товаров)`;
          }
        } catch (e) {
          // Fallback if parsing fails
          description += ` - товары из корзины`;
        }
      }
      
      const response = await fetch("/api/create-payment-intent", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount: order.totalPrice,
          description,
          orderId: order.orderNumber,
          returnUrl: `https://t.me/kavaraappbot/app?startapp=payment_success`,
          customerEmail: order.customerEmail,
          customerPhone: order.customerPhone
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || errorData.details || "Failed to create payment");
      }

      const intent = await response.json();
      setPaymentIntent(intent);

      // Store payment ID in the order
      if (intent.id && order.id) {
        try {
          await fetch(`/api/orders/${order.id}/payment-id`, {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              paymentId: intent.id
            })
          });
          console.log(`Payment ID ${intent.id} saved for order ${order.orderNumber}`);
        } catch (error) {
          console.error("Failed to update order with payment ID:", error);
        }
      }

      if (intent.paymentUrl) {
        window.open(intent.paymentUrl, '_blank');
      }
    } catch (error) {
      console.error("Payment creation error:", error);
      const errorMessage = error instanceof Error ? error.message : "Не удалось создать платеж. Попробуйте ещё раз.";
      toast({
        title: "Ошибка",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsCreatingPayment(false);
    }
  };

  const checkPaymentStatus = async () => {
    if (!paymentIntent || !order) return;

    try {
      // Check order status directly by order number
      const response = await fetch(`/api/orders/number/${order.orderNumber}`);
      if (!response.ok) {
        throw new Error("Failed to fetch order");
      }
      
      const orderData = await response.json();

      if (orderData.status === 'paid') {
        toast({
          title: "Оплата прошла успешно!",
          description: "Ваш заказ принят в обработку.",
        });
        // Store order data in session for payment success page
        sessionStorage.setItem("currentOrder", JSON.stringify(orderData));
        if (box) {
          sessionStorage.setItem("selectedBox", JSON.stringify(box));
        }
        setLocation("/payment/success");
      } else {
        toast({
          title: "Платеж еще не прошел",
          description: "Проверьте, что оплата завершена в ЮKassa и попробуйте еще раз.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Payment status check error:", error);
      toast({
        title: "Ошибка проверки статуса",
        description: "Не удалось проверить статус платежа. Попробуйте еще раз.",
        variant: "destructive",
      });
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">Заказ не найден</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="p-4 bg-black text-white">
        <div className="flex items-center space-x-3">
          <button 
            className="p-2" 
            onClick={() => {
              if (order?.orderNumber) {
                setLocation(`/order-details?order=${order.orderNumber}`);
              } else {
                setLocation("/order");
              }
            }}
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div>
            <h2 className="font-semibold">Оплата заказа</h2>
            <p className="text-sm text-white/80">#{order.orderNumber}</p>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Order Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Детали заказа</span>
              <Badge variant="outline">{order.status}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Order Items Display */}
            {box ? (
              <div className="flex items-center space-x-4">
                <img 
                  src={box.imageUrl || "/placeholder-box.jpg"} 
                  alt={box.name}
                  className="w-16 h-16 rounded-lg object-cover"
                />
                <div className="flex-1">
                  <h3 className="font-semibold">{box.name}</h3>
                  <p className="text-sm text-gray-600">{box.description}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold">{order.totalPrice}₽</p>
                </div>
              </div>
            ) : (
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center">
                  <CreditCard className="w-8 h-8 text-gray-400" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold">Товары из корзины</h3>
                  <p className="text-sm text-gray-600">
                    {order.cartItems ? (
                      `${JSON.parse(order.cartItems).length} товаров`
                    ) : (
                      '1 товаров'
                    )}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-bold">{order.totalPrice}₽</p>
                </div>
              </div>
            )}

            <div className="border-t pt-4 space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Доставка:</span>
                <span>{order.deliveryMethod === 'courier' ? 'Курьер' : order.deliveryMethod === 'pickup' ? 'Самовывоз' : 'Почта'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Получатель:</span>
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

            <div className="border-t pt-4">
              <div className="flex justify-between items-center text-lg font-bold">
                <span>К оплате:</span>
                <span>{order.totalPrice}₽</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Payment Methods */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <CreditCard className="w-5 h-5" />
              <span>Способ оплаты</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 border rounded-lg bg-blue-50">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">ЮК</span>
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold">ЮKassa</h4>
                  <p className="text-sm text-gray-600">
                    Безопасная оплата через ЮKassa
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              {!paymentIntent ? (
                <Button 
                  onClick={createPayment}
                  disabled={isCreatingPayment}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3"
                  size="lg"
                >
                  {isCreatingPayment ? (
                    <>
                      <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                      Создаём платеж...
                    </>
                  ) : (
                    <>
                      <CreditCard className="w-5 h-5 mr-2" />
                      Оплатить {order.totalPrice}₽
                    </>
                  )}
                </Button>
              ) : (
                <div className="space-y-3">
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <h4 className="font-semibold text-green-800 mb-2">
                      Платеж создан
                    </h4>
                    <p className="text-sm text-green-600 mb-3">
                      Откройте страницу оплаты в новом окне и завершите платеж
                    </p>
                    <div className="flex flex-col space-y-2">
                      <Button 
                        onClick={() => window.open(paymentIntent.paymentUrl, '_blank')}
                        variant="outline"
                        size="sm"
                        className="w-full"
                        data-testid="button-open-payment"
                      >
                        <ExternalLink className="w-4 h-4 mr-2" />
                        Открыть оплату
                      </Button>
                      <Button 
                        onClick={checkPaymentStatus}
                        size="sm"
                        className="w-full"
                        data-testid="button-check-status"
                      >
                        Проверить статус
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <p className="text-xs text-gray-500 text-center">
              Нажимая кнопку оплаты, вы соглашаетесь с условиями использования сервиса
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}