import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Trash2, Plus, Minus, ShoppingBag, ArrowLeft, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { useTelegram } from "@/hooks/use-telegram";
import logoImage from "@assets/Group 1 (4)_1762503053535.png";

interface CartItem {
  id: string;
  boxId?: string;
  productId?: string;
  userId: string;
  itemType: string;
  quantity: number;
  selectedSize?: string;
  createdAt: string;
  box?: {
    id: string;
    name: string;
    description: string;
    price: number;
    imageUrl: string;
    category: string;
  };
  product?: {
    id: string;
    name: string;
    description: string;
    price: number;
    imageUrl: string;
    category: string;
    sizes: string[];
  };
}

export default function Cart() {
  const [, setLocation] = useLocation();
  const { user: telegramUser } = useTelegram();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [promoCode, setPromoCode] = useState("");
  const [appliedPromo, setAppliedPromo] = useState<{ code: string; discountPercent: number } | null>(null);
  const [isValidatingPromo, setIsValidatingPromo] = useState(false);

  // Get database user by telegram ID
  const { data: dbUser } = useQuery<{ id: string; telegramId: string; firstName?: string; lastName?: string; username?: string; loyaltyPoints: number }>({
    queryKey: [`/api/users/telegram/${telegramUser?.id}`],
    enabled: !!telegramUser?.id
  });

  const { data: cartItems, isLoading } = useQuery<CartItem[]>({
    queryKey: [`/api/cart/${dbUser?.id}`],
    enabled: !!dbUser?.id,
  });

  const removeFromCartMutation = useMutation({
    mutationFn: async (itemId: string) => {
      const response = await fetch(`/api/cart/${itemId}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to remove item");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/cart/${dbUser?.id}`] });
      toast({
        title: "Удалено",
        description: "Товар удален из корзины",
      });
    },
  });

  const updateQuantityMutation = useMutation({
    mutationFn: async ({ itemId, quantity }: { itemId: string; quantity: number }) => {
      const response = await fetch(`/api/cart/${itemId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quantity }),
      });
      if (!response.ok) throw new Error("Failed to update quantity");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/cart/${dbUser?.id}`] });
    },
  });

  const totalPrice = cartItems?.reduce((sum, item) => {
    const itemPrice = item.itemType === "product" ? item.product?.price || 0 : item.box?.price || 0;
    return sum + (itemPrice * item.quantity);
  }, 0) || 0;
  const totalItems = cartItems?.reduce((sum, item) => sum + item.quantity, 0) || 0;

  // Calculate discount
  const discount = appliedPromo ? Math.floor(totalPrice * (appliedPromo.discountPercent / 100)) : 0;
  const finalPrice = totalPrice - discount;

  const handleApplyPromo = async () => {
    if (!promoCode.trim()) {
      toast({
        title: "Ошибка",
        description: "Введите промокод",
        variant: "destructive",
      });
      return;
    }

    setIsValidatingPromo(true);
    try {
      const response = await fetch("/api/promo-codes/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: promoCode.toUpperCase() }),
      });

      const data = await response.json();

      if (data.isValid) {
        setAppliedPromo({
          code: promoCode.toUpperCase(),
          discountPercent: data.discountPercent,
        });
        toast({
          title: "Промокод применен",
          description: `Скидка ${data.discountPercent}% активирована!`,
        });
      } else {
        toast({
          title: "Неверный промокод",
          description: data.error || "Промокод не найден или неактивен",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось проверить промокод",
        variant: "destructive",
      });
    } finally {
      setIsValidatingPromo(false);
    }
  };

  const handleCheckout = () => {
    if (!cartItems || cartItems.length === 0) {
      toast({
        title: "Корзина пуста",
        description: "Добавьте товары в корзину для оформления заказа",
        variant: "destructive",
      });
      return;
    }
    
    // Сохраняем данные корзины для чекаута как единый заказ
    const cartOrder = {
      id: "cart-order",
      orderNumber: `CART-${Date.now()}`,
      userId: dbUser?.id,
      customerName: "",
      customerPhone: "",
      customerEmail: "",
      deliveryMethod: "",
      paymentMethod: "",
      totalPrice: finalPrice,
      status: "pending",
      cartItems: cartItems,
      promoCode: appliedPromo?.code || undefined,
    };
    
    sessionStorage.setItem("currentOrder", JSON.stringify(cartOrder));
    sessionStorage.setItem("isCartCheckout", "true");
    
    setLocation("/order");
  };

  // Check if user is authenticated via Telegram
  if (!telegramUser) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Вход требуется</h1>
          <p className="text-gray-400 mb-6">
            Корзина доступна только авторизованным пользователям
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
          <div className="animate-spin w-8 h-8 border-4 border-white border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-white">Загрузка данных пользователя...</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-white border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-white">Загружаем корзину...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black pb-96">
      {/* Header with KAVARA Logo */}
      <div className="bg-black text-white py-4 px-4 sticky top-0 z-50">
        <div className="text-center mb-4">
          <img 
            src={logoImage} 
            alt="KAVARA" 
            className="h-12 mx-auto"
            data-testid="img-logo"
          />
        </div>
      </div>

      <div className="pb-4">
        {cartItems && cartItems.length > 0 ? (
            <div className="mx-4 max-w-2xl lg:mx-auto">
              {/* Cart Title */}
              <h2 className="text-white text-lg font-semibold mb-4">Корзина:</h2>
              
              {/* Cart Items */}
              <div className="space-y-3">
              {cartItems.map((item) => {
                const currentItem = item.itemType === "product" ? item.product : item.box;
                if (!currentItem) return null;
                
                return (
                <Card key={item.id} data-testid={`card-item-${item.id}`}>
                  <CardContent className="p-4">
                    {item.itemType === "box" ? (
                      // Box layout: horizontal with name/price in one line
                      <div className="space-y-3">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="font-semibold text-lg">{currentItem.name}</h3>
                            {item.selectedSize && (
                              <p className="text-sm text-gray-600">Размер: {item.selectedSize}</p>
                            )}
                          </div>
                          <div className="text-xl font-bold" data-testid={`text-price-${item.id}`}>
                            {(typeof currentItem.price === 'string' ? parseFloat(currentItem.price) : currentItem.price).toLocaleString()}₽
                          </div>
                        </div>
                        <div className="h-px bg-gray-200"></div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                updateQuantityMutation.mutate({
                                  itemId: item.id,
                                  quantity: Math.max(1, item.quantity - 1),
                                })
                              }
                              disabled={item.quantity <= 1}
                              data-testid={`button-decrease-${item.id}`}
                            >
                              <Minus className="w-4 h-4" />
                            </Button>
                            <span className="w-8 text-center font-semibold" data-testid={`text-quantity-${item.id}`}>{item.quantity}</span>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                updateQuantityMutation.mutate({
                                  itemId: item.id,
                                  quantity: item.quantity + 1,
                                })
                              }
                              data-testid={`button-increase-${item.id}`}
                            >
                              <Plus className="w-4 h-4" />
                            </Button>
                          </div>
                          <button
                            onClick={() => removeFromCartMutation.mutate(item.id)}
                            className="text-sm underline text-gray-700 hover:text-black"
                            data-testid={`button-delete-${item.id}`}
                          >
                            Удалить
                          </button>
                        </div>
                      </div>
                    ) : (
                      // Product layout: with image on left, name/price in one line
                      <div className="flex gap-4">
                        <img
                          src={currentItem.imageUrl}
                          alt={currentItem.name}
                          loading="lazy"
                          className="w-20 h-20 object-cover rounded-lg"
                          data-testid={`img-product-${item.id}`}
                        />
                        <div className="flex-1 space-y-3">
                          <div className="flex items-start justify-between">
                            <div>
                              <h3 className="font-semibold text-lg">{currentItem.name}</h3>
                              {item.selectedSize && (
                                <p className="text-sm text-gray-600">Размер: {item.selectedSize}</p>
                              )}
                            </div>
                            <div className="text-xl font-bold" data-testid={`text-price-${item.id}`}>
                              {(typeof currentItem.price === 'string' ? parseFloat(currentItem.price) : currentItem.price).toLocaleString()}₽
                            </div>
                          </div>
                          <div className="h-px bg-gray-200"></div>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                  updateQuantityMutation.mutate({
                                    itemId: item.id,
                                    quantity: Math.max(1, item.quantity - 1),
                                  })
                                }
                                disabled={item.quantity <= 1}
                                data-testid={`button-decrease-${item.id}`}
                              >
                                <Minus className="w-4 h-4" />
                              </Button>
                              <span className="w-8 text-center font-semibold" data-testid={`text-quantity-${item.id}`}>{item.quantity}</span>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                  updateQuantityMutation.mutate({
                                    itemId: item.id,
                                    quantity: item.quantity + 1,
                                  })
                                }
                                data-testid={`button-increase-${item.id}`}
                              >
                                <Plus className="w-4 h-4" />
                              </Button>
                            </div>
                            <button
                              onClick={() => removeFromCartMutation.mutate(item.id)}
                              className="text-sm underline text-gray-700 hover:text-black"
                              data-testid={`button-delete-${item.id}`}
                            >
                              Удалить
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
                );
              })}
            </div>
            </div>
        ) : (
          <div className="text-center py-16">
            <ShoppingBag className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">Корзина пуста</h3>
            <p className="text-gray-500 mb-6">Добавьте товары из каталога</p>
            <Button
              onClick={() => setLocation("/catalog")}
              className="bg-black hover:bg-gray-800 text-white"
            >
              Перейти в каталог
            </Button>
          </div>
        )}
      </div>

      {/* Fixed Bottom Summary */}
      {cartItems && cartItems.length > 0 && (
        <div className="fixed bottom-20 left-0 right-0 z-40 flex justify-center px-4">
          <div className="w-full max-w-2xl">
            <Card className="max-h-[40vh] overflow-y-auto">
              <CardContent className="p-4 space-y-4">
                {/* Promo Code Input */}
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <Input
                      placeholder="Введите промокод"
                      value={promoCode}
                      onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                      className="pl-10 border-2 border-gray-300 focus:border-black"
                      disabled={!!appliedPromo}
                      data-testid="input-promo-code"
                    />
                  </div>
                  {!appliedPromo ? (
                    <Button
                      onClick={handleApplyPromo}
                      disabled={isValidatingPromo || !promoCode.trim()}
                      className="bg-black hover:bg-gray-800 text-white px-6"
                      data-testid="button-apply-promo"
                    >
                      {isValidatingPromo ? "..." : "Применить"}
                    </Button>
                  ) : (
                    <Button
                      onClick={() => {
                        setAppliedPromo(null);
                        setPromoCode("");
                      }}
                      variant="outline"
                      className="px-6"
                      data-testid="button-remove-promo"
                    >
                      Удалить
                    </Button>
                  )}
                </div>

                {/* Price Summary */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-base">
                    <span className="text-gray-600" data-testid="text-items-count">Товары ({totalItems} шт.)</span>
                    <span className="font-semibold">{totalPrice.toLocaleString()}₽</span>
                  </div>
                  
                  {appliedPromo && (
                    <div className="flex justify-between items-center text-base text-green-600">
                      <span data-testid="text-discount-label">Скидка ({appliedPromo.discountPercent}%)</span>
                      <span className="font-semibold" data-testid="text-discount-amount">-{discount.toLocaleString()}₽</span>
                    </div>
                  )}
                  
                  <div className="flex justify-between items-center text-xl pt-2 border-t-2 border-gray-200">
                    <span className="font-bold">Итого</span>
                    <span className="font-bold" data-testid="text-final-price">{finalPrice.toLocaleString()}₽</span>
                  </div>
                </div>

                {/* Checkout Button */}
                <Button
                  className="w-full bg-black hover:bg-gray-800 text-white py-6 text-lg font-semibold"
                  onClick={handleCheckout}
                  data-testid="button-checkout"
                >
                  Оформить заказ
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}