import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Trash2, Plus, Minus, ShoppingBag, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { useTelegram } from "@/hooks/use-telegram";

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

  // Get database user by telegram ID
  const { data: dbUser } = useQuery<{ id: string; telegramId: string; firstName?: string; lastName?: string; username?: string; loyaltyPoints: number }>({
    queryKey: [`/api/users/telegram/${telegramUser?.id}`],
    enabled: !!telegramUser?.id
  });

  const { data: cartItems, isLoading } = useQuery<CartItem[]>({
    queryKey: ['/api/cart', dbUser?.id],
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
      queryClient.invalidateQueries({ queryKey: ['/api/cart', dbUser?.id] });
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
      queryClient.invalidateQueries({ queryKey: ['/api/cart', dbUser?.id] });
    },
  });

  const totalPrice = cartItems?.reduce((sum, item) => {
    const itemPrice = item.itemType === "product" ? item.product?.price || 0 : item.box?.price || 0;
    return sum + (itemPrice * item.quantity);
  }, 0) || 0;
  const totalItems = cartItems?.reduce((sum, item) => sum + item.quantity, 0) || 0;

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
    const totalPrice = cartItems.reduce((sum, item) => {
      const itemPrice = item.itemType === "product" ? item.product?.price || 0 : item.box?.price || 0;
      return sum + (itemPrice * item.quantity);
    }, 0);
    const cartOrder = {
      id: "cart-order",
      orderNumber: `CART-${Date.now()}`,
      userId: dbUser?.id,
      customerName: "",
      customerPhone: "",
      customerEmail: "",
      deliveryMethod: "",
      paymentMethod: "",
      totalPrice: totalPrice,
      status: "pending",
      cartItems: cartItems
    };
    
    sessionStorage.setItem("currentOrder", JSON.stringify(cartOrder));
    sessionStorage.setItem("isCartCheckout", "true");
    
    setLocation("/order");
  };

  // Check if user is authenticated via Telegram
  if (!telegramUser) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-black mb-4">Вход требуется</h1>
          <p className="text-gray-600 mb-6">
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-gray-600">Загрузка данных пользователя...</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Загружаем корзину...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="p-4 bg-black text-white">
        <div className="flex items-center space-x-3">
          <button onClick={() => setLocation("/catalog")}>
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div className="text-2xl">🛒</div>
          <div>
            <h2 className="font-semibold">Корзина</h2>
            <p className="text-sm text-gray-300">{totalItems} товаров</p>
          </div>
        </div>
      </div>

      <div className="p-4">
        {cartItems && cartItems.length > 0 ? (
          <div className="space-y-4">
            {/* Cart Items */}
            <div className="space-y-3">
              {cartItems.map((item) => {
                const currentItem = item.itemType === "product" ? item.product : item.box;
                if (!currentItem) return null;
                
                return (
                <Card key={item.id} data-testid={`card-item-${item.id}`}>
                  <CardContent className="p-4">
                    <div className="flex gap-4">
                      <img
                        src={currentItem.imageUrl}
                        alt={currentItem.name}
                        className="w-20 h-20 object-cover rounded-lg"
                        data-testid={`img-product-${item.id}`}
                      />
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg">{currentItem.name}</h3>
                        <p className="text-gray-600 text-sm mb-1">{currentItem.description}</p>
                        {item.selectedSize && (
                          <p className="text-sm text-blue-600 font-medium mb-2">Размер: {item.selectedSize}</p>
                        )}
                        <div className="text-xl font-bold mb-2" data-testid={`text-price-${item.id}`}>{(typeof currentItem.price === 'string' ? parseFloat(currentItem.price) : currentItem.price).toLocaleString()}₽</div>
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
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => removeFromCartMutation.mutate(item.id)}
                            data-testid={`button-delete-${item.id}`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                );
              })}
            </div>

            {/* Total and Checkout */}
            <Card className="bg-white">
              <CardHeader>
                <CardTitle>Итого</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center text-lg">
                  <span data-testid="text-items-count">Товары ({totalItems} шт.)</span>
                  <span className="font-bold" data-testid="text-total-price">{totalPrice.toLocaleString()}₽</span>
                </div>
                <Button
                  className="w-full bg-black hover:bg-gray-800 text-white py-6 text-lg"
                  onClick={handleCheckout}
                  data-testid="button-checkout"
                >
                  Оформить заказ
                </Button>
              </CardContent>
            </Card>
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
    </div>
  );
}