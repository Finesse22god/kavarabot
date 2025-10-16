import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useMutation, useQuery } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import LoadingOverlay from "@/components/loading-overlay";
import PromoCodeInput from "@/components/PromoCodeInput";
import LoyaltyPointsInput from "@/components/LoyaltyPointsInput";
import type { Box, Order } from "@shared/schema";
import { useTelegram } from "@/hooks/use-telegram";

interface OrderFormData {
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  deliveryMethod: string;
  paymentMethod: string;
}

interface PromoCodeDiscount {
  code: string;
  discountPercent: number;
  discountAmount: number;
  trainer?: any;
}

export default function Order() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { user: telegramUser, isInTelegram } = useTelegram();
  const [selectedBox, setSelectedBox] = useState<Box | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [appliedPromoCode, setAppliedPromoCode] = useState<PromoCodeDiscount | null>(null);
  const [loyaltyPointsUsed, setLoyaltyPointsUsed] = useState(0);
  const [formData, setFormData] = useState<OrderFormData>({
    customerName: "",
    customerPhone: "",
    customerEmail: "",
    deliveryMethod: "",
    paymentMethod: "",
  });

  // Get database user by telegram ID
  const { data: dbUser } = useQuery<{ id: string; telegramId: string; firstName?: string; lastName?: string; username?: string; loyaltyPoints: number }>({
    queryKey: [`/api/users/telegram/${telegramUser?.id}`],
    enabled: !!telegramUser?.id
  });

  // Get user loyalty stats
  const { data: loyaltyStats } = useQuery<{
    totalPoints: number;
    totalEarned: number;
    totalSpent: number;
    totalReferrals: number;
    level: string;
    nextLevelPoints: number;
  }>({
    queryKey: [`/api/loyalty/${dbUser?.id}/stats`],
    enabled: !!dbUser?.id
  });

  useEffect(() => {
    // Проверяем, пришли ли мы из корзины
    const isCartCheckout = sessionStorage.getItem("isCartCheckout");
    const currentOrder = sessionStorage.getItem("currentOrder");
    const storedBox = sessionStorage.getItem("selectedBox");
    
    if (isCartCheckout && currentOrder) {
      // Оформление из корзины - используем данные заказа
      const orderData = JSON.parse(currentOrder);
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
    
    // Apply promo code discount
    if (appliedPromoCode) {
      const discount = typeof appliedPromoCode.discountAmount === 'string' ? parseFloat(appliedPromoCode.discountAmount) : appliedPromoCode.discountAmount;
      total = total - discount;
    }
    
    // Apply loyalty points discount
    total = total - loyaltyPointsUsed;
    
    return Math.max(0, total);
  };

  const getOriginalPrice = () => {
    if (!selectedBox) return 0;
    const price = typeof selectedBox.price === 'string' ? parseFloat(selectedBox.price) : selectedBox.price;
    return price + calculateDeliveryPrice() + calculatePaymentFee();
  };

  const handlePromoCodeApplied = (discount: PromoCodeDiscount) => {
    setAppliedPromoCode(discount);
  };

  const handlePromoCodeRemoved = () => {
    setAppliedPromoCode(null);
  };

  const handleLoyaltyPointsUsed = (points: number) => {
    setLoyaltyPointsUsed(points);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedBox) return;

    // Validate all required fields
    const isValid = formData.customerName && 
                   formData.customerPhone &&
                   formData.customerEmail &&
                   formData.deliveryMethod && 
                   formData.paymentMethod;

    if (!isValid) {
      toast({
        title: "Ошибка",
        description: "Заполните все обязательные поля",
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
        
        // Рассчитываем общую сумму всех товаров в корзине
        const totalCartPrice = cartOrderData.cartItems.reduce((sum: number, cartItem: any) => {
          const item = cartItem.itemType === "product" ? cartItem.product : cartItem.box;
          return sum + ((item?.price || 0) * cartItem.quantity);
        }, 0);
        
        // Применяем скидки к общей сумме
        let finalPrice = totalCartPrice;
        if (appliedPromoCode) {
          finalPrice = finalPrice * (1 - appliedPromoCode.discountPercent / 100);
        }
        finalPrice = Math.max(0, finalPrice - loyaltyPointsUsed);
        
        // Используем первый товар как основу заказа, но с общей суммой корзины
        const firstItem = cartOrderData.cartItems[0];
        const combinedOrderData = {
          userId: dbUser?.id || "",
          ...(firstItem.itemType === "product" ? { productId: firstItem.product?.id } : { boxId: firstItem.box?.id }),
          quantity: 1, // Один "комбинированный" заказ
          selectedSize: firstItem.selectedSize,
          customerName: formData.customerName,
          customerPhone: formData.customerPhone,
          customerEmail: formData.customerEmail,
          telegramUsername: telegramUser?.username || dbUser?.username || "",
          deliveryMethod: formData.deliveryMethod,
          paymentMethod: formData.paymentMethod,
          totalPrice: Math.round(finalPrice), // Общая сумма всех товаров корзины
          promoCode: appliedPromoCode?.code,
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
          deliveryMethod: formData.deliveryMethod,
          paymentMethod: formData.paymentMethod,
          totalPrice: calculateTotalPrice(),
          promoCode: appliedPromoCode?.code,
          loyaltyPointsUsed: loyaltyPointsUsed,
        };

        createOrder.mutate(orderData);
      }
    }, 2000);
  };

  // Check authentication
  if (!isInTelegram || !telegramUser) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-black mb-4">Доступ запрещен</h1>
          <p className="text-gray-600 mb-6">
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-gray-600">Загрузка данных пользователя...</p>
        </div>
      </div>
    );
  }

  if (!selectedBox) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Загрузка...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
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
      <div className="p-4 bg-gradient-to-br from-orange-50 to-blue-50">
        <div className="bg-white rounded-xl p-4 shadow-lg">
          <h3 className="font-semibold mb-3">Подтверждение выбора</h3>
          <div className="flex items-center space-x-4">
            <img 
              src={selectedBox.imageUrl || "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b"} 
              alt={selectedBox.name}
              className="w-20 h-20 object-cover rounded-lg"
            />
            <div className="flex-1">
              <h4 className="font-semibold">{selectedBox.name}</h4>
              <p className="text-sm text-gray-600">{selectedBox.description}</p>
              <p className="text-lg font-bold text-primary mt-1">
                {(typeof selectedBox.price === 'string' ? parseFloat(selectedBox.price) : selectedBox.price).toLocaleString('ru-RU')}₽
              </p>
            </div>
          </div>
          <Button 
            variant="outline" 
            className="w-full mt-4"
            onClick={() => window.history.back()}
          >
            Изменить выбор
          </Button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="p-4 space-y-4">
        {/* Contact Information */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="font-semibold mb-4">Контактные данные</h3>
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Имя *</Label>
              <Input
                id="name"
                placeholder="Ваше имя"
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

        {/* Delivery Options */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="font-semibold mb-4">Доставка</h3>
          <RadioGroup 
            value={formData.deliveryMethod}
            onValueChange={(value) => setFormData(prev => ({ ...prev, deliveryMethod: value }))}
          >
            <div className="flex items-center space-x-2 p-3 border border-gray-300 rounded-lg">
              <RadioGroupItem value="courier" id="courier" />
              <Label htmlFor="courier" className="flex items-center space-x-2 cursor-pointer">
                <span className="text-xl">🚚</span>
                <span className="font-medium">Курьер по Москве</span>
              </Label>
            </div>
            <div className="flex items-center space-x-2 p-3 border border-gray-300 rounded-lg">
              <RadioGroupItem value="cdek" id="cdek" />
              <Label htmlFor="cdek" className="flex items-center space-x-2 cursor-pointer">
                <span className="text-xl">📦</span>
                <span className="font-medium">СДЭК</span>
              </Label>
            </div>
            <div className="flex items-center space-x-2 p-3 border border-gray-300 rounded-lg">
              <RadioGroupItem value="pickup" id="pickup" />
              <Label htmlFor="pickup" className="flex items-center space-x-2 cursor-pointer">
                <span className="text-xl">🏪</span>
                <span className="font-medium">Самовывоз</span>
              </Label>
            </div>
          </RadioGroup>
        </div>

        {/* Payment Options */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="font-semibold mb-4">Оплата</h3>
          <RadioGroup 
            value={formData.paymentMethod}
            onValueChange={(value) => setFormData(prev => ({ ...prev, paymentMethod: value }))}
          >
            <div className="flex items-center space-x-2 p-3 border border-gray-300 rounded-lg">
              <RadioGroupItem value="card" id="card" />
              <Label htmlFor="card" className="flex items-center space-x-2 cursor-pointer">
                <span className="text-xl">💳</span>
                <span className="font-medium">Банковская карта</span>
              </Label>
            </div>
          </RadioGroup>
        </div>

        {/* Promo Code Section */}
        {dbUser && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <PromoCodeInput
              onPromoCodeApplied={handlePromoCodeApplied}
              onPromoCodeRemoved={handlePromoCodeRemoved}
              orderAmount={getOriginalPrice()}
              appliedPromoCode={appliedPromoCode?.code}
            />
          </div>
        )}

        {/* Loyalty Points Section */}
        {dbUser && loyaltyStats && loyaltyStats.totalPoints > 0 && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <LoyaltyPointsInput
              availablePoints={loyaltyStats.totalPoints}
              onPointsUsed={handleLoyaltyPointsUsed}
              currentUsage={loyaltyPointsUsed}
              maxUsablePoints={Math.min(loyaltyStats.totalPoints, Math.floor(getOriginalPrice() * 0.5))} // Max 50% of order
            />
          </div>
        )}

        {/* Order Summary */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="font-semibold mb-4">Итого к оплате</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>Товар:</span>
              <span>{selectedBox ? (typeof selectedBox.price === 'string' ? parseFloat(selectedBox.price) : selectedBox.price).toLocaleString('ru-RU') : 0}₽</span>
            </div>
            {appliedPromoCode && (
              <div className="flex justify-between text-green-600">
                <span>Скидка по промокоду:</span>
                <span>-{appliedPromoCode.discountAmount.toLocaleString('ru-RU')}₽</span>
              </div>
            )}
            {loyaltyPointsUsed > 0 && (
              <div className="flex justify-between text-green-600">
                <span>Скидка баллами:</span>
                <span>-{loyaltyPointsUsed.toLocaleString('ru-RU')}₽</span>
              </div>
            )}
            <hr className="my-2" />
            <div className="flex justify-between items-center text-lg font-bold">
              <span>Итого:</span>
              <span className="text-primary">
                {calculateTotalPrice().toLocaleString('ru-RU')}₽
              </span>
            </div>
          </div>
        </div>

        {/* Final Order Button */}
        <Button 
          type="submit"
          className="w-full bg-primary text-white text-lg py-4"
          disabled={createOrder.isPending}
        >
          {createOrder.isPending ? "Оформляем заказ..." : "Оформить заказ"}
        </Button>

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