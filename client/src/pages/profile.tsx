import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { User, Edit, Heart, Package, Clock, CheckCircle, Truck, RefreshCw, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useTelegram } from "@/hooks/use-telegram";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";
import { useUserFavorites } from "@/hooks/use-favorites";
import BoxCard from "@/components/box-card";
import ProductCard from "@/components/product-card";
import type { QuizResponse } from "@shared/schema";

export default function Profile() {
  const { user, isInTelegram } = useTelegram();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  
  // Get tab from URL parameters
  const urlParams = new URLSearchParams(window.location.search);
  const tabFromUrl = urlParams.get('tab') || 'personal';
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: ""
  });
  const [notifications, setNotifications] = useState({
    orders: true,
    promotions: false,
    newBoxes: true,
  });
  const [contactForm, setContactForm] = useState({
    message: ""
  });
  const [feedbackForm, setFeedbackForm] = useState({
    type: "",
    message: ""
  });
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [isCreatingPayment, setIsCreatingPayment] = useState(false);

  // Fetch user data from our database
  const { data: userData } = useQuery<{id: string; telegramId: string; firstName?: string; lastName?: string}>({
    queryKey: [`/api/users/telegram/${user?.id?.toString()}`],
    enabled: !!user?.id,
  });

  // Update formData when userData changes
  useEffect(() => {
    if (userData) {
      setFormData({
        firstName: userData.firstName || user?.first_name || "",
        lastName: userData.lastName || user?.last_name || ""
      });
    } else if (user) {
      setFormData({
        firstName: user.first_name || "",
        lastName: user.last_name || ""
      });
    }
  }, [userData, user]);

  const { data: quizResponse } = useQuery<QuizResponse>({
    queryKey: ["/api/quiz-responses/user", userData?.id],
    queryFn: async () => {
      try {
        return await apiRequest("GET", `/api/quiz-responses/user/${userData?.id}`);
      } catch (error: any) {
        if (error.message?.includes('404')) return null;
        throw error;
      }
    },
    enabled: !!userData?.id,
  });

  // Fetch user measurements from database
  const { data: userMeasurements } = useQuery<{height?: string; weight?: string; preferredSize?: string; chestSize?: string; waistSize?: string; hipSize?: string; sleeveLength?: string}>({
    queryKey: [`/api/users/measurements/${userData?.id}`],
    enabled: !!userData?.id,
    retry: 1,
  });


  // Fetch user favorites
  const { data: userFavorites, isLoading: favoritesLoading } = useUserFavorites(userData?.id);

  // Fetch user's orders
  const { data: orders, isLoading: ordersLoading, refetch: refetchOrders } = useQuery({
    queryKey: ["/api/orders/user", user?.id],
    queryFn: async () => {
      const response = await fetch(`/api/orders/user/${user?.id}`);
      if (!response.ok) throw new Error("Failed to fetch orders");
      return response.json();
    },
    enabled: !!user?.id,
  });

  // Fetch loyalty stats
  const { data: loyaltyStats } = useQuery<{
    totalPoints: number;
    totalEarned: number;
    totalSpent: number;
    totalReferrals: number;
    level: string;
    nextLevelPoints: number;
  }>({
    queryKey: [`/api/loyalty/${userData?.id}/stats`],
    enabled: !!userData?.id
  });

  // Fetch user's owned promo code
  const { data: ownerPromoData } = useQuery<{
    promoCode: {
      id: string;
      code: string;
      discountPercent: number;
      pointsPerUse: number;
      usedCount: number;
      maxUses: number | null;
      isActive: boolean;
      partnerName?: string;
      partnerContact?: string;
    };
    stats: {
      totalUses: number;
      totalPointsEarned: number;
      recentUsages: any[];
    };
  } | null>({
    queryKey: [`/api/promo-codes/owner/${userData?.id}`],
    enabled: !!userData?.id
  });

  // Handle feedback submission
  const handleFeedbackSubmit = () => {
    if (!feedbackForm.message.trim()) {
      alert('Пожалуйста, опишите ваше обращение');
      return;
    }
    
    if (!feedbackForm.type) {
      alert('Пожалуйста, выберите тип обращения');
      return;
    }
    
    // Send feedback to admin Telegram channel
    fetch('/api/send-feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: feedbackForm.type,
        message: feedbackForm.message,
        username: user?.username || 'Аноним'
      })
    }).then(() => {
      alert('Отзыв отправлен! Спасибо за обратную связь.');
      setFeedbackForm({ type: "", message: "" });
    }).catch(() => {
      // Fallback to Telegram manager
      if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
        window.Telegram.WebApp.openTelegramLink("https://t.me/kavarabrand");
      } else {
        window.open("https://t.me/kavarabrand", "_blank");
      }
    });
  };

  // Check authentication
  if (!isInTelegram || !user) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-6 font-jetbrains">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Доступ запрещен</h1>
          <p className="text-gray-400 mb-6">
            Профиль доступен только пользователям Telegram
          </p>
          <Button onClick={() => window.location.href = "/"}>На главную</Button>
        </div>
      </div>
    );
  }

  const handleSaveProfile = async () => {
    try {
      const updatedUser = await apiRequest("PUT", `/api/users/${userData?.id}`, formData);
      
      // Update local state  
      setFormData({
        firstName: updatedUser.firstName || "",
        lastName: updatedUser.lastName || ""
      });
      
      // Invalidate userData query to refresh
      queryClient.invalidateQueries({ queryKey: [`/api/users/telegram/${user?.id?.toString()}`] });
      
      toast({
        title: "Успех",
        description: "Данные профиля обновлены"
      });
      setIsEditing(false);
    } catch (error) {
      console.error("Profile update error:", error);
      toast({
        title: "Ошибка",
        description: "Не удалось обновить данные профиля. Попробуйте еще раз.",
        variant: "destructive"
      });
    }
  };

  const handleSelectBox = (box: any) => {
    sessionStorage.setItem("selectedBox", JSON.stringify(box));
    setLocation("/order");
  };

  const calculateOrderTotal = (order: any) => {
    if (order.totalPrice && order.totalPrice > 0) {
      return order.totalPrice;
    }
    if (order.cartItems) {
      try {
        const items = JSON.parse(order.cartItems);
        const total = items.reduce((sum: number, item: any) => {
          return sum + ((item.price || 0) * (item.quantity || 1));
        }, 0);
        if (total > 0) return total;
      } catch (error) {
        console.error('Error parsing cart items:', error);
      }
    }
    return order.totalPrice || 0;
  };

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

  const OrderCard = ({ order }: { order: any }) => (
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
          onClick={() => {
            if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
              window.Telegram.WebApp.openTelegramLink("https://t.me/kavarabrand");
            } else {
              window.open("https://t.me/kavarabrand", "_blank");
            }
          }}
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

  // Payment redirect function (unified approach)
  const handlePayment = async (order: any) => {
    setIsCreatingPayment(true);
    try {
      // Calculate order total
      const orderTotal = order.totalPrice || 0;
      
      if (!orderTotal || orderTotal <= 0) {
        toast({
          title: "Ошибка",
          description: "Не удается определить стоимость заказа. Обратитесь в поддержку.",
          variant: "destructive",
        });
        return;
      }

      console.log("Preparing payment redirect for order:", {
        orderNumber: order.orderNumber,
        totalPrice: orderTotal,
        status: order.status
      });
      
      // Prepare order data with calculated total for checkout page
      const orderWithTotal = { ...order, totalPrice: orderTotal };
      
      // Save order data to sessionStorage for checkout page
      sessionStorage.setItem("currentOrder", JSON.stringify(orderWithTotal));
      
      // If order has a box, fetch and save box data
      if (order.boxId) {
        try {
          const response = await fetch(`/api/boxes/${order.boxId}`);
          if (response.ok) {
            const boxData = await response.json();
            sessionStorage.setItem("selectedBox", JSON.stringify(boxData));
          }
        } catch (error) {
          console.error("Failed to fetch box data:", error);
          // Continue with payment even if box data fetch fails
        }
      }
      
      // Redirect to unified checkout page
      setLocation("/checkout");
      
    } catch (error) {
      console.error("Error preparing payment:", error);
      toast({
        title: "Ошибка",
        description: "Не удалось подготовить данные для оплаты. Попробуйте еще раз.",
        variant: "destructive",
      });
    } finally {
      setIsCreatingPayment(false);
    }
  };

  // Order Details Component
  const OrderDetails = ({ order, onBack }: { order: any; onBack: () => void }) => {
    return (
      <div className="min-h-screen bg-black pb-20 font-jetbrains">
        <div className="p-4 bg-black text-white">
          <div className="flex items-center space-x-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={onBack}
              className="text-white hover:text-gray-300"
            >
              ← Назад
            </Button>
            <div>
              <h2 className="font-semibold">Заказ #{order.orderNumber}</h2>
            </div>
          </div>
        </div>

        <div className="p-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Детали заказа</span>
                <Badge variant={order.status === 'paid' ? 'default' : 'secondary'}>
                  {order.status === 'paid' ? 'Оплачен' : 
                   order.status === 'pending' ? 'Ожидает оплаты' : order.status}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-500">Номер заказа</Label>
                  <p className="text-lg font-semibold">#{order.orderNumber}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Дата заказа</Label>
                  <p>{new Date(order.createdAt).toLocaleDateString('ru-RU', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Сумма заказа</Label>
                  <p className="text-lg font-semibold">{order.totalPrice.toLocaleString()}₽</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Способ доставки</Label>
                  <p>{order.deliveryMethod}</p>
                </div>
              </div>

              {order.customerName && (
                <div>
                  <Label className="text-sm font-medium text-gray-500">Контактные данные</Label>
                  <div className="mt-1">
                    <p><strong>Имя:</strong> {order.customerName}</p>
                    {order.customerPhone && <p><strong>Телефон:</strong> {order.customerPhone}</p>}
                    {order.customerEmail && <p><strong>Email:</strong> {order.customerEmail}</p>}
                  </div>
                </div>
              )}

              {order.deliveryAddress && (
                <div>
                  <Label className="text-sm font-medium text-gray-500">Адрес доставки</Label>
                  <p className="mt-1">{order.deliveryAddress}</p>
                </div>
              )}

              {order.comment && (
                <div>
                  <Label className="text-sm font-medium text-gray-500">Комментарий к заказу</Label>
                  <p className="mt-1">{order.comment}</p>
                </div>
              )}

              {order.status === 'pending' && (
                <div className="pt-4 border-t">
                  <Button
                    onClick={() => handlePayment(order)}
                    disabled={isCreatingPayment}
                    className="w-full"
                    data-testid="button-pay-order"
                  >
                    {isCreatingPayment ? (
                      <>
                        <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                        Создание ссылки...
                      </>
                    ) : (
                      "💳 Оплатить заказ"
                    )}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  };

  // Show order details if order is selected
  if (selectedOrder) {
    return <OrderDetails order={selectedOrder} onBack={() => setSelectedOrder(null)} />;
  }

  return (
    <div className="min-h-screen overflow-y-auto bg-black pb-20 font-jetbrains">
      <div className="p-4 bg-black text-white">
        <div className="flex items-center space-x-3">
          <div className="text-2xl">👤</div>
          <div>
            <h2 className="font-semibold">Профиль</h2>
          </div>
        </div>
      </div>

      <div className="p-4">
        <Tabs defaultValue={tabFromUrl} className="w-full">
          <TabsList className="grid w-full grid-cols-3 text-xs">
            <TabsTrigger value="personal">Данные</TabsTrigger>
            <TabsTrigger value="orders">Заказы</TabsTrigger>
            <TabsTrigger value="favorites">Избранное</TabsTrigger>
          </TabsList>
          
          <TabsContent value="personal" className="mt-4 pb-24">
            <div className="space-y-4">
              {/* Личные данные */}
              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-semibold">Личные данные</h3>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={isEditing ? handleSaveProfile : () => setIsEditing(true)}
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    {isEditing ? "Сохранить" : "Редактировать"}
                  </Button>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="firstName">Имя</Label>
                    {isEditing ? (
                      <Input
                        id="firstName"
                        value={formData.firstName}
                        onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                        placeholder="Введите ваше имя"
                      />
                    ) : (
                      <div className="p-3 border border-gray-200 rounded-md bg-gray-50">
                        {formData.firstName || "Не указано"}
                      </div>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="lastName">Фамилия</Label>
                    {isEditing ? (
                      <Input
                        id="lastName"
                        value={formData.lastName}
                        onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                        placeholder="Введите вашу фамилию"
                      />
                    ) : (
                      <div className="p-3 border border-gray-200 rounded-md bg-gray-50">
                        {formData.lastName || "Не указано"}
                      </div>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="username">Username</Label>
                    <Input
                      id="username"
                      value={user?.username || ""}
                      disabled={true}
                      className="bg-gray-100"
                    />
                    <p className="text-xs text-gray-500 mt-1">Username из Telegram нельзя изменить</p>
                  </div>
                </div>
              </div>

              {/* Размеры */}
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="font-semibold mb-6">Размеры и параметры</h3>
                
                {userMeasurements || quizResponse ? (
                  <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-white border-2 border-black p-4 rounded-lg">
                        <p className="text-sm text-gray-600 mb-1">Размер</p>
                        <p className="text-xl font-bold text-black text-center">
                          {userMeasurements?.preferredSize || quizResponse?.size || "Не указан"}
                        </p>
                      </div>
                      <div className="bg-white border-2 border-black p-4 rounded-lg">
                        <p className="text-sm text-gray-600 mb-1">Рост</p>
                        <p className="text-xl font-bold text-black text-center">
                          {userMeasurements?.height ? `${userMeasurements.height} см` : 
                           quizResponse?.height ? `${quizResponse.height} см` : "Не указан"}
                        </p>
                      </div>
                      <div className="bg-white border-2 border-black p-4 rounded-lg">
                        <p className="text-sm text-gray-600 mb-1">Вес</p>
                        <p className="text-xl font-bold text-black text-center">
                          {userMeasurements?.weight ? `${userMeasurements.weight} кг` : 
                           quizResponse?.weight ? `${quizResponse.weight} кг` : "Не указан"}
                        </p>
                      </div>
                      <div className="bg-white border-2 border-black p-4 rounded-lg">
                        <p className="text-sm text-gray-600 mb-1">Рукав</p>
                        <p className="text-xl font-bold text-black text-center">
                          {userMeasurements?.sleeveLength ? `${userMeasurements.sleeveLength} см` : "Не указан"}
                        </p>
                      </div>
                    </div>
                    
                    {userMeasurements && (userMeasurements.chestSize || userMeasurements.waistSize || userMeasurements.hipSize) && (
                      <div>
                        <Label className="text-sm font-medium text-gray-700 mb-3 block">Обхваты</Label>
                        <div className="grid grid-cols-3 gap-4">
                          <div className="bg-white border-2 border-black p-4 rounded-lg">
                            <p className="text-sm text-gray-600 mb-1">Грудь</p>
                            <p className="text-xl font-bold text-black text-center">
                              {userMeasurements.chestSize ? `${userMeasurements.chestSize} см` : "—"}
                            </p>
                          </div>
                          <div className="bg-white border-2 border-black p-4 rounded-lg">
                            <p className="text-sm text-gray-600 mb-1">Талия</p>
                            <p className="text-xl font-bold text-black text-center">
                              {userMeasurements.waistSize ? `${userMeasurements.waistSize} см` : "—"}
                            </p>
                          </div>
                          <div className="bg-white border-2 border-black p-4 rounded-lg">
                            <p className="text-sm text-gray-600 mb-1">Бедра</p>
                            <p className="text-xl font-bold text-black text-center">
                              {userMeasurements.hipSize ? `${userMeasurements.hipSize} см` : "—"}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    <div className="pt-2">
                      <Button 
                        variant="outline" 
                        className="w-full"
                        onClick={() => setLocation("/quiz")}
                      >
                        Пройти опрос
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <User className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 mb-4">Размеры и параметры не указаны</p>
                    <Button 
                      className="w-full"
                      onClick={() => setLocation("/quiz")}
                    >
                      Пройти опрос
                    </Button>
                  </div>
                )}
              </div>

              {/* Loyalty Points Section */}
              {loyaltyStats && (
                <div className="bg-white rounded-xl shadow-lg p-6">
                  <h3 className="font-semibold mb-4 flex items-center">
                    <span className="text-2xl mr-2">🎁</span>
                    Баллы лояльности
                  </h3>
                  
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-white border-2 border-black p-4 rounded-lg">
                        <p className="text-sm text-gray-600 mb-1">Доступно баллов</p>
                        <p className="text-2xl font-bold text-black">{loyaltyStats.totalPoints}</p>
                      </div>
                      <div className="bg-white border-2 border-black p-4 rounded-lg">
                        <p className="text-sm text-gray-600 mb-1">Всего заработано</p>
                        <p className="text-2xl font-bold text-black">{loyaltyStats.totalEarned}</p>
                      </div>
                      <div className="bg-white border-2 border-black p-4 rounded-lg">
                        <p className="text-sm text-gray-600 mb-1">Использовано</p>
                        <p className="text-2xl font-bold text-black">{loyaltyStats.totalSpent}</p>
                      </div>
                      <div className="bg-white border-2 border-black p-4 rounded-lg">
                        <p className="text-sm text-gray-600 mb-1">Рефералов</p>
                        <p className="text-2xl font-bold text-black">{loyaltyStats.totalReferrals}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Owner Promo Code Section */}
              {ownerPromoData && ownerPromoData.promoCode && (
                <div className="bg-white rounded-xl shadow-lg p-6">
                  <h3 className="font-semibold mb-4 flex items-center">
                    <span className="text-2xl mr-2">🎫</span>
                    Мой промокод
                  </h3>
                  
                  <div className="space-y-4">
                    {/* Promo Code Display */}
                    <div className="bg-gradient-to-r from-orange-500 to-red-500 p-6 rounded-xl text-white">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm opacity-90">Код для партнеров</p>
                        <Badge variant={ownerPromoData.promoCode.isActive ? "default" : "secondary"} className="bg-white text-orange-600">
                          {ownerPromoData.promoCode.isActive ? "Активен" : "Неактивен"}
                        </Badge>
                      </div>
                      <p className="text-3xl font-bold tracking-wider mb-3">{ownerPromoData.promoCode.code}</p>
                      <div className="flex items-center justify-between text-sm opacity-90">
                        <span>Скидка: {ownerPromoData.promoCode.discountPercent}%</span>
                        <span>Награда: {ownerPromoData.promoCode.pointsPerUse} баллов</span>
                      </div>
                    </div>

                    {/* Statistics */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-white border-2 border-black p-4 rounded-lg text-center">
                        <p className="text-sm text-gray-600 mb-1">Использований</p>
                        <p className="text-2xl font-bold text-black">
                          {ownerPromoData.stats.totalUses}
                          {ownerPromoData.promoCode.maxUses && (
                            <span className="text-sm text-gray-500"> / {ownerPromoData.promoCode.maxUses}</span>
                          )}
                        </p>
                      </div>
                      <div className="bg-white border-2 border-black p-4 rounded-lg text-center">
                        <p className="text-sm text-gray-600 mb-1">Заработано баллов</p>
                        <p className="text-2xl font-bold text-black">{ownerPromoData.stats.totalPointsEarned}</p>
                      </div>
                    </div>

                    {/* Partner Info - Only show if both fields have values */}
                    {ownerPromoData.promoCode.partnerName && ownerPromoData.promoCode.partnerContact && (
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <p className="text-xs font-medium text-gray-500 mb-2">Информация о партнере</p>
                        <p className="text-sm font-medium text-gray-900">{ownerPromoData.promoCode.partnerName}</p>
                        <p className="text-sm text-gray-600">{ownerPromoData.promoCode.partnerContact}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="orders" className="mt-4 pb-24">
            <div className="space-y-4">
              <div className="bg-white rounded-xl shadow-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <Package className="w-6 h-6 text-orange-500" />
                    <h3 className="font-semibold">Мои заказы</h3>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      queryClient.invalidateQueries({ queryKey: ["/api/orders/user", user?.id] });
                      refetchOrders();
                    }}
                    className="text-gray-600 hover:bg-gray-100"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </Button>
                </div>

                {ordersLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
                    <p className="text-gray-600">Загружаем заказы...</p>
                  </div>
                ) : orders && orders.length > 0 ? (
                  <div className="mt-4 space-y-4">
                    {orders.map((order: any) => (
                      <OrderCard key={order.id} order={order} />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 px-4">
                    <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h4 className="text-lg font-semibold text-gray-800 mb-2">
                      У вас еще нет заказов
                    </h4>
                    <p className="text-sm text-gray-500 mb-6">
                      Перейдите в каталог или посмотрите готовые боксы
                    </p>
                    <div className="flex gap-3 justify-center">
                      <Button 
                        onClick={() => setLocation("/?view=catalog")}
                        className="bg-black hover:bg-gray-800 text-white"
                        data-testid="button-goto-catalog"
                      >
                        Каталог
                      </Button>
                      <Button 
                        onClick={() => setLocation("/?view=boxes")}
                        variant="outline"
                        className="border-black text-black hover:bg-gray-100"
                        data-testid="button-goto-boxes"
                      >
                        Боксы
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="favorites" className="mt-4 pb-24">
            <div className="space-y-4">
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="font-semibold mb-4 flex items-center">
                  <Heart className="w-5 h-5 mr-2 text-red-500" />
                  Избранное
                </h3>
                
                {favoritesLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
                    <p className="text-gray-600">Загружаем избранное...</p>
                  </div>
                ) : userFavorites && userFavorites.length > 0 ? (
                  <div className="grid grid-cols-1 gap-4">
                    {userFavorites.map((favorite: any) => (
                      <div key={favorite.id}>
                        {favorite.box ? (
                          <BoxCard
                            box={favorite.box}
                            onSelect={handleSelectBox}
                            userId={userData?.id}
                            variant="default"
                          />
                        ) : favorite.product ? (
                          <ProductCard
                            product={favorite.product}
                            userId={userData?.id}
                            onAddToCart={async (product, size) => {
                              try {
                                await apiRequest("POST", "/api/cart", {
                                  userId: userData?.id,
                                  productId: product.id,
                                  quantity: 1,
                                  selectedSize: size,
                                  itemType: "product"
                                });
                                queryClient.invalidateQueries({ queryKey: ["/api/cart"] });
                                toast({
                                  title: "Добавлено в корзину",
                                  description: `${product.name} добавлен в корзину`,
                                });
                              } catch (error) {
                                toast({
                                  title: "Ошибка",
                                  description: "Не удалось добавить товар в корзину",
                                  variant: "destructive",
                                });
                              }
                            }}
                          />
                        ) : null}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Heart className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 mb-4">У вас пока нет избранных товаров</p>
                    <Button 
                      variant="outline"
                      onClick={() => setLocation("/catalog")}
                    >
                      Перейти в каталог
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}