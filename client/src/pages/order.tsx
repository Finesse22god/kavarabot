import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useMutation, useQuery } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import LoadingOverlay from "@/components/loading-overlay";
import type { Box, Order } from "@shared/schema";
import { useTelegram } from "@/hooks/use-telegram";

interface OrderFormData {
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  deliveryAddress: string;
  paymentMethod: string;
}

export default function Order() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { user: telegramUser, isInTelegram } = useTelegram();
  const [selectedBox, setSelectedBox] = useState<Box | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loyaltyPointsUsed, setLoyaltyPointsUsed] = useState(0);
  const [formData, setFormData] = useState<OrderFormData>({
    customerName: "",
    customerPhone: "",
    customerEmail: "",
    deliveryAddress: "",
    paymentMethod: "card",
  });

  // Get database user by telegram ID
  const { data: dbUser } = useQuery<{ id: string; telegramId: string; firstName?: string; lastName?: string; username?: string; loyaltyPoints: number }>({
    queryKey: [`/api/users/telegram/${telegramUser?.id}`],
    enabled: !!telegramUser?.id
  });

  useEffect(() => {
    // Проверяем, пришли ли мы из корзины
    const isCartCheckout = sessionStorage.getItem("isCartCheckout");
    const currentOrder = sessionStorage.getItem("currentOrder");
    const storedBox = sessionStorage.getItem("selectedBox");
    
    if (isCartCheckout && currentOrder) {
      // Оформление из корзины - используем данные заказа
      const orderData = JSON.parse(currentOrder);
      
      // Загружаем баллы, которые были использованы в корзине
      if (orderData.loyaltyPointsUsed) {
        setLoyaltyPointsUsed(orderData.loyaltyPointsUsed);
      }
      
      // Создаем фиктивный box для отображения
      const cartBox = {
        id: "cart-order",
        name: "Товары из корзины",
        description: `${orderData.cartItems?.length || 0} товаров`,
        price: orderData.totalPrice,
        imageUrl: orderData.cartItems?.[0]?.box?.imageUrl || "",
        isFromCart: true
      };
      setSelectedBox(cartBox as any);
    } else if (storedBox) {
      setSelectedBox(JSON.parse(storedBox));
    } else {
      setLocation("/");
    }
  }, [setLocation]);

  const createOrder = useMutation({
    mutationFn: async (orderData: any) => {
      const data = await apiRequest("POST", "/api/orders", orderData);
      return data;
    },
    onSuccess: (newOrder: Order) => {
      // Save order and box data to session storage for checkout
      sessionStorage.setItem("currentOrder", JSON.stringify(newOrder));
      sessionStorage.setItem("selectedBox", JSON.stringify(selectedBox));
      
      toast({
        title: "Заказ создан!",
        description: `Номер заказа: ${newOrder.orderNumber}`,
      });
      
      setIsLoading(false);
      // Redirect to checkout for payment
      setLocation("/checkout");
    },
    onError: () => {
      toast({
        title: "Ошибка",
        description: "Не удалось оформить заказ. Попробуйте снова.",
        variant: "destructive",
      });
      setIsLoading(false);
    },
  });

  const calculateDeliveryPrice = () => {
    // All delivery methods are now free
    return 0;
  };

  const calculatePaymentFee = () => {
    // No payment fees
    return 0;
  };

  const calculateTotalPrice = () => {
    if (!selectedBox) return 0;
    
    const price = typeof selectedBox.price === 'string' ? parseFloat(selectedBox.price) : selectedBox.price;
    let total = price + calculateDeliveryPrice() + calculatePaymentFee();
    
    // Apply loyalty points discount
    // Note: selectedBox.price already contains priceAfterPromo (after promo code but before loyalty points)
    // so we subtract loyalty points here
    total = total - loyaltyPointsUsed;
    
    return Math.max(0, total);
  };

  const getOriginalPrice = () => {
    if (!selectedBox) return 0;
    const price = typeof selectedBox.price === 'string' ? parseFloat(selectedBox.price) : selectedBox.price;
    return price + calculateDeliveryPrice() + calculatePaymentFee();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedBox) return;

    // Validate all required fields
    const isValid = formData.customerName && 
                   formData.customerPhone &&
                   formData.customerEmail &&
                   formData.deliveryAddress &&
                   formData.paymentMethod;

    if (!isValid) {
      toast({
        title: "Ошибка",
        description: "Заполните все обязательные поля",
        variant: "destructive",
      });
      return;
    }

    if (formData.deliveryAddress.trim().length < 5) {
      toast({
        title: "Ошибка",
        description: "Введите полный адрес пункта выдачи СДЭК",
        variant: "destructive",
      });
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.customerEmail)) {
      toast({
        title: "Ошибка",
        description: "Введите корректный email адрес",
        variant: "destructive",
      });
      return;
    }

    // Validate phone format (must be exactly 11 digits for Russian number: 7 + 10 digits)
    const phoneDigits = formData.customerPhone.replace(/\D/g, '');
    if (phoneDigits.length !== 11 || !phoneDigits.startsWith('7')) {
      toast({
        title: "Ошибка",
        description: "Введите полный номер телефона в формате +7 (XXX) XXX-XX-XX",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    // Simulate processing time
    setTimeout(() => {
      // Проверяем, оформляем ли заказ из корзины
      const isCartCheckout = sessionStorage.getItem("isCartCheckout");
      const currentOrder = sessionStorage.getItem("currentOrder");
      
      if (isCartCheckout && currentOrder) {
        // Оформление из корзины - создаем один общий заказ на всю сумму
        const cartOrderData = JSON.parse(currentOrder);
        
        const priceAfterPromo = cartOrderData.totalPrice;
        
        const firstItem = cartOrderData.cartItems[0];
        const combinedOrderData = {
          userId: dbUser?.id || "",
          ...(firstItem.itemType === "product" ? { productId: firstItem.product?.id } : { boxId: firstItem.box?.id }),
          quantity: 1,
          selectedSize: firstItem.selectedSize,
          customerName: formData.customerName,
          customerPhone: formData.customerPhone,
          customerEmail: formData.customerEmail,
          telegramUsername: telegramUser?.username || dbUser?.username || "",
          deliveryMethod: "cdek",
          deliveryAddress: formData.deliveryAddress,
          paymentMethod: formData.paymentMethod,
          totalPrice: Math.round(priceAfterPromo),
          loyaltyPointsUsed: loyaltyPointsUsed,
          cartItems: JSON.stringify(cartOrderData.cartItems), // Сохраняем полный состав корзины
        };
        
        // Создаем один заказ вместо множества
        apiRequest("POST", "/api/orders", combinedOrderData)
          .then((order) => {
            // Очищаем корзину после успешного оформления
            cartOrderData.cartItems.forEach((cartItem: any) => {
              fetch(`/api/cart/${cartItem.id}`, { method: "DELETE" });
            });
            
            // Сохраняем данные заказа для оплаты
            sessionStorage.setItem("currentOrder", JSON.stringify(order));
            sessionStorage.setItem("selectedBox", JSON.stringify(selectedBox));
            sessionStorage.removeItem("isCartCheckout");
            
            toast({
              title: "Заказ создан!",
              description: `Номер заказа: ${order.orderNumber}`,
            });
            
            setIsLoading(false);
            setLocation("/checkout");
          })
          .catch(() => {
            toast({
              title: "Ошибка",
              description: "Не удалось оформить заказ из корзины",
              variant: "destructive",
            });
            setIsLoading(false);
          });
      } else {
        // Обычное оформление одного товара
        const orderData = {
          userId: dbUser?.id || "",
          boxId: selectedBox.id,
          customerName: formData.customerName,
          customerPhone: formData.customerPhone,
          customerEmail: formData.customerEmail,
          telegramUsername: telegramUser?.username || dbUser?.username || "",
          deliveryMethod: "cdek",
          deliveryAddress: formData.deliveryAddress,
          paymentMethod: formData.paymentMethod,
          totalPrice: getOriginalPrice(),
          loyaltyPointsUsed: loyaltyPointsUsed,
        };

        createOrder.mutate(orderData);
      }
    }, 2000);
  };

  // Check authentication
  if (!isInTelegram || !telegramUser) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Доступ запрещен</h1>
          <p className="text-gray-400 mb-6">
            Заказы доступны только пользователям Telegram
          </p>
          <Button onClick={() => setLocation("/")}>На главную</Button>
        </div>
      </div>
    );
  }

  // Wait for database user to load
  if (!dbUser && telegramUser) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-gray-400">Загрузка данных пользователя...</p>
        </div>
      </div>
    );
  }

  if (!selectedBox) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-400">Загрузка...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      <LoadingOverlay isVisible={isLoading} />
      
      <div className="p-4 bg-black text-white">
        <div className="flex items-center space-x-3">
          <button 
            className="p-2" 
            onClick={() => window.history.back()}
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div>
            <h2 className="font-semibold">Оформление заказа</h2>
          </div>
        </div>
      </div>

      {/* Order Confirmation */}
      <div className="px-4 pt-4">
        <h2 className="text-white text-lg font-semibold mb-3">Ваш заказ:</h2>
        <Card>
          <CardContent className="p-4">
            <div className="space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-lg">{selectedBox.name}</h3>
                  {selectedBox.description && (
                    <p className="text-sm text-gray-600">{selectedBox.description}</p>
                  )}
                </div>
                <div className="text-xl font-bold">
                  {(typeof selectedBox.price === 'string' ? parseFloat(selectedBox.price) : selectedBox.price).toLocaleString()}₽
                </div>
              </div>
              <div className="h-px bg-gray-200"></div>
              <button
                onClick={() => window.history.back()}
                className="text-sm underline text-gray-700 hover:text-black"
              >
                Изменить выбор
              </button>
            </div>
          </CardContent>
        </Card>
      </div>

      <form onSubmit={handleSubmit} className="p-4 space-y-4">
        {/* Contact Information */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="font-semibold mb-4">Контактные данные</h3>
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">ФИО получателя *</Label>
              <Input
                id="name"
                placeholder="Фамилия Имя Отчество"
                value={formData.customerName}
                onChange={(e) => setFormData(prev => ({ ...prev, customerName: e.target.value }))}
                required
                data-testid="input-name"
              />
            </div>
            <div>
              <Label htmlFor="phone">Номер телефона *</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="+7 (999) 123-45-67"
                value={formData.customerPhone}
                onChange={(e) => {
                  const value = e.target.value;
                  
                  // Remove all non-digits
                  const digits = value.replace(/\D/g, '');
                  
                  // If empty or user tries to delete everything, show +7
                  if (value === '' || digits.length === 0) {
                    setFormData(prev => ({ ...prev, customerPhone: '+7' }));
                    return;
                  }
                  
                  // Extract local digits (after country code 7)
                  let localDigits = '';
                  if (digits.startsWith('7')) {
                    localDigits = digits.slice(1);
                  } else if (digits.startsWith('8')) {
                    localDigits = digits.slice(1);
                  } else {
                    localDigits = digits;
                  }
                  
                  // Limit to maximum 10 digits
                  if (localDigits.length > 10) {
                    return;
                  }
                  
                  // Format: +7 (XXX) XXX-XX-XX
                  let formatted = '+7';
                  
                  if (localDigits.length > 0) {
                    formatted += ' (' + localDigits.slice(0, 3);
                    if (localDigits.length >= 3) {
                      formatted += ')';
                    }
                  }
                  if (localDigits.length > 3) {
                    formatted += ' ' + localDigits.slice(3, 6);
                  }
                  if (localDigits.length > 6) {
                    formatted += '-' + localDigits.slice(6, 8);
                  }
                  if (localDigits.length > 8) {
                    formatted += '-' + localDigits.slice(8, 10);
                  }
                  
                  setFormData(prev => ({ ...prev, customerPhone: formatted }));
                }}
                onFocus={(e) => {
                  // Auto-fill +7 when user focuses on empty field
                  if (!formData.customerPhone || formData.customerPhone === '') {
                    setFormData(prev => ({ ...prev, customerPhone: '+7' }));
                  }
                }}
                maxLength={18}
                required
                data-testid="input-phone"
              />
            </div>
            <div>
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                placeholder="example@mail.com"
                value={formData.customerEmail}
                onChange={(e) => setFormData(prev => ({ ...prev, customerEmail: e.target.value }))}
                pattern="^[^\s@]+@[^\s@]+\.[^\s@]+$"
                required
                data-testid="input-email"
              />
            </div>
          </div>
        </div>

        {/* Delivery */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="font-semibold mb-1">Доставка</h3>
          <p className="text-sm text-gray-500 mb-4 flex items-center gap-1">
            <span>📦</span> Доставка осуществляется через СДЭК
          </p>
          <div>
            <Label htmlFor="deliveryAddress">Адрес пункта выдачи СДЭК *</Label>
            <Textarea
              id="deliveryAddress"
              placeholder="Например: г. Москва, ул. Ленина, д. 10, ПВЗ СДЭК"
              value={formData.deliveryAddress}
              onChange={(e) => setFormData(prev => ({ ...prev, deliveryAddress: e.target.value }))}
              rows={2}
              required
              className="mt-1 resize-none"
              data-testid="input-delivery-address"
            />
            <p className="text-xs text-gray-400 mt-1">Введите полный адрес ПВЗ СДЭК, куда доставить заказ</p>
          </div>
        </div>

        {/* Order Summary */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="font-semibold mb-4">Итого к оплате</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>Товар:</span>
              <span>{selectedBox ? (typeof selectedBox.price === 'string' ? parseFloat(selectedBox.price) : selectedBox.price).toLocaleString('ru-RU') : 0}₽</span>
            </div>
            {loyaltyPointsUsed > 0 && (
              <div className="flex justify-between text-green-600">
                <span>Скидка баллами:</span>
                <span>-{loyaltyPointsUsed.toLocaleString('ru-RU')}₽</span>
              </div>
            )}
            <hr className="my-2" />
            <div className="flex justify-between items-center text-lg font-bold mb-4">
              <span>Итого:</span>
              <span className="text-primary">
                {calculateTotalPrice().toLocaleString('ru-RU')}₽
              </span>
            </div>

            {/* Final Order Button */}
            <Button 
              type="submit"
              className="w-full bg-black hover:bg-gray-800 text-white text-lg py-4"
              disabled={createOrder.isPending}
              data-testid="button-submit-order"
            >
              {createOrder.isPending ? "Оформляем заказ..." : "Оформить заказ"}
            </Button>
          </div>
        </div>

        {/* Contact Manager Button */}
        <div className="flex justify-center pt-4">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              if (isInTelegram) {
                window.open('https://t.me/kavarabrand', '_blank');
              } else {
                window.open('https://t.me/kavarabrand', '_blank');
              }
            }}
            className="bg-primary text-white hover:bg-primary/90"
            data-testid="button-contact-manager"
          >
            Связаться с менеджером
          </Button>
        </div>
      </form>
    </div>
  );
}