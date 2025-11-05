import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { User, Edit, Settings, Heart, Bell, Gift, Copy, Star, Trophy, Clock, Phone, MessageCircle, RotateCcw, FileText, HelpCircle, Users, Package, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
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
  
  // Redirect to /my-orders when orders tab is accessed
  useEffect(() => {
    if (tabFromUrl === 'orders') {
      setLocation('/my-orders');
    }
  }, [tabFromUrl, setLocation]);
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


  // FAQ data
  const faqData = [
    {
      question: "Как работает подбор боксов?",
      answer: "Наши стилисты анализируют ваши ответы в анкете о размерах, целях тренировок и бюджете, чтобы подобрать идеальный комплект спортивной одежды."
    },
    {
      question: "Можно ли вернуть или обменять товар?",
      answer: "Да, у вас есть 14 дней для возврата или обмена товара в оригинальной упаковке и без следов использования."
    },
    {
      question: "Какие способы доставки доступны?",
      answer: "Мы предлагаем доставку курьером по Москве (300₽), СДЭК по России (от 250₽) и самовывоз (бесплатно)."
    },
    {
      question: "Как часто выходят новые боксы?",
      answer: "Новые коллекции выходят ежемесячно. Подпишитесь на уведомления, чтобы не пропустить!"
    },
    {
      question: "Можно ли изменить состав бокса?",
      answer: "Готовые боксы имеют фиксированный состав, но вы можете пройти персональный опрос для индивидуального подбора."
    }
  ];

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
      <div className="min-h-screen bg-black flex items-center justify-center p-6">
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

  const OrdersSection = () => {
    setLocation("/my-orders");
    return null;
  };

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
      <div className="min-h-screen bg-black pb-20">
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
    <div className="h-screen overflow-hidden bg-black pb-20">
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
          <TabsList className="grid w-full grid-cols-4 text-xs">
            <TabsTrigger value="personal">Данные</TabsTrigger>
            <TabsTrigger value="orders">Заказы</TabsTrigger>
            <TabsTrigger value="favorites">Избранное</TabsTrigger>
            <TabsTrigger value="contacts">Контакты</TabsTrigger>
          </TabsList>
          
          <TabsContent value="personal" className="mt-4">
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
                <h3 className="font-semibold mb-4">Размеры и параметры</h3>
                
                {userMeasurements || quizResponse ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Предпочитаемый размер</Label>
                        <div className="p-3 bg-gray-50 rounded-lg">
                          {userMeasurements?.preferredSize || quizResponse?.size || "Не указан"}
                        </div>
                      </div>
                      <div>
                        <Label>Рост</Label>
                        <div className="p-3 bg-gray-50 rounded-lg">
                          {userMeasurements?.height ? `${userMeasurements.height} см` : 
                           quizResponse?.height ? `${quizResponse.height} см` : "Не указан"}
                        </div>
                      </div>
                      <div>
                        <Label>Вес</Label>
                        <div className="p-3 bg-gray-50 rounded-lg">
                          {userMeasurements?.weight ? `${userMeasurements.weight} кг` : 
                           quizResponse?.weight ? `${quizResponse.weight} кг` : "Не указан"}
                        </div>
                      </div>
                      <div>
                        <Label>Длина рукава</Label>
                        <div className="p-3 bg-gray-50 rounded-lg">
                          {userMeasurements?.sleeveLength ? `${userMeasurements.sleeveLength} см` : "Не указана"}
                        </div>
                      </div>
                    </div>
                    
                    {userMeasurements && (userMeasurements.chestSize || userMeasurements.waistSize || userMeasurements.hipSize) && (
                      <div>
                        <Label className="mb-2 block">Обхваты</Label>
                        <div className="grid grid-cols-3 gap-4">
                          <div>
                            <Label className="text-xs text-gray-600">Грудь</Label>
                            <div className="p-2 bg-gray-50 rounded text-sm">
                              {userMeasurements.chestSize ? `${userMeasurements.chestSize} см` : "—"}
                            </div>
                          </div>
                          <div>
                            <Label className="text-xs text-gray-600">Талия</Label>
                            <div className="p-2 bg-gray-50 rounded text-sm">
                              {userMeasurements.waistSize ? `${userMeasurements.waistSize} см` : "—"}
                            </div>
                          </div>
                          <div>
                            <Label className="text-xs text-gray-600">Бедра</Label>
                            <div className="p-2 bg-gray-50 rounded text-sm">
                              {userMeasurements.hipSize ? `${userMeasurements.hipSize} см` : "—"}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        className="flex-1"
                        onClick={() => setLocation("/catalog")}
                      >
                        Обновить в каталоге
                      </Button>
                      <Button 
                        variant="outline" 
                        className="flex-1"
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
                    <div className="flex gap-2">
                      <Button 
                        variant="outline"
                        className="flex-1"
                        onClick={() => setLocation("/catalog")}
                      >
                        Указать в каталоге
                      </Button>
                      <Button 
                        className="flex-1"
                        onClick={() => setLocation("/quiz")}
                      >
                        Пройти опрос
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="orders" className="mt-4">
            <OrdersSection />
          </TabsContent>

          <TabsContent value="favorites" className="mt-4">
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


          <TabsContent value="contacts" className="mt-4">
            <div className="space-y-4">
              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <HelpCircle className="w-6 h-6 text-primary" />
                  <h3 className="font-semibold">Частые вопросы</h3>
                </div>
                
                <Accordion type="single" collapsible className="space-y-2">
                  {faqData.map((item, index) => (
                    <AccordionItem key={index} value={`item-${index}`}>
                      <AccordionTrigger className="text-left">
                        {item.question}
                      </AccordionTrigger>
                      <AccordionContent className="text-gray-600">
                        {item.answer}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </div>

              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <MessageCircle className="w-6 h-6 text-primary" />
                  <h3 className="font-semibold">Связь с оператором</h3>
                </div>
                
                <div className="space-y-4">
                  <p className="text-gray-600 text-sm">
                    Наш менеджер поможет вам с любыми вопросами по заказам, размерам, доставке и возврату.
                  </p>
                  
                  <Button 
                    className="w-full bg-primary text-white"
                    onClick={() => {
                      if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
                        window.Telegram.WebApp.openTelegramLink("https://t.me/kavarabrand");
                      } else {
                        window.open("https://t.me/kavarabrand", "_blank");
                      }
                    }}
                  >
                    <MessageCircle className="w-4 h-4 mr-2" />
                    Связаться с менеджером
                  </Button>
                </div>
              </div>
              
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h4 className="font-semibold mb-3">Telegram канал KAVARA</h4>
                <div className="space-y-3">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <MessageCircle className="w-6 h-6 text-blue-600" />
                        <div>
                          <p className="font-semibold text-blue-900">Подписаться на канал</p>
                          <p className="text-sm text-blue-700">Новинки, акции и эксклюзивный контент</p>
                        </div>
                      </div>
                      <Button 
                        onClick={() => {
                          if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
                            window.Telegram.WebApp.openTelegramLink("https://t.me/kavarabrand");
                          } else {
                            window.open("https://t.me/kavarabrand", "_blank");
                          }
                        }}
                        size="sm"
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                      >
                        Подписаться
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}