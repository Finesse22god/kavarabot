import { useState } from "react";
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
    firstName: user?.first_name || "",
    lastName: user?.last_name || ""
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

  // Fetch user data from our database
  const { data: userData } = useQuery<{id: string; telegramId: string; firstName?: string; lastName?: string}>({
    queryKey: [`/api/users/telegram/${user?.id?.toString()}`],
    enabled: !!user?.id,
  });

  const { data: quizResponse } = useQuery<QuizResponse>({
    queryKey: ["/api/quiz-responses/user", userData?.id],
    queryFn: async () => {
      const response = await fetch(`/api/quiz-responses/user/${userData?.id}`);
      if (!response.ok) {
        if (response.status === 404) return null;
        throw new Error("Failed to fetch quiz response");
      }
      return response.json();
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
      // Fallback to Telegram
      const message = `Тип: ${feedbackForm.type}\n\nСообщение: ${feedbackForm.message}`;
      window.open(`https://t.me/finessgod?text=${encodeURIComponent(message)}`, '_blank');
    });
  };

  // Check authentication
  if (!isInTelegram || !user) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-black mb-4">Доступ запрещен</h1>
          <p className="text-gray-600 mb-6">
            Профиль доступен только пользователям Telegram
          </p>
          <Button onClick={() => window.location.href = "/"}>На главную</Button>
        </div>
      </div>
    );
  }

  const handleSaveProfile = async () => {
    try {
      const response = await fetch(`/api/users/${userData?.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error("Failed to update profile");
      }

      const updatedUser = await response.json();
      
      // Update local state
      setFormData({
        firstName: updatedUser.firstName || "",
        lastName: updatedUser.lastName || ""
      });
      
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
    const { data: orders, isLoading: ordersLoading } = useQuery({
      queryKey: [`/api/orders/user/${userData?.id}`],
      enabled: !!userData?.id,
    });

    if (ordersLoading) {
      return (
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="text-center">
            <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-gray-600">Загружаем заказы...</p>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="font-semibold mb-4 flex items-center">
            <Package className="w-5 h-5 mr-2 text-blue-500" />
            Мои заказы
          </h3>
          
          {orders && (orders as any[]).length > 0 ? (
            <div className="space-y-4">
              {(orders as any[]).map((order: any) => (
                <div key={order.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-semibold">Заказ #{order.orderNumber}</p>
                      <p className="text-sm text-gray-600">
                        {new Date(order.createdAt).toLocaleDateString('ru-RU')}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">{order.totalPrice.toLocaleString()}₽</p>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        order.status === 'paid' ? 'bg-green-100 text-green-800' :
                        order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {order.status === 'paid' ? 'Оплачен' :
                         order.status === 'pending' ? 'Ожидает оплаты' :
                         order.status}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-600">
                      <p>{order.customerName || 'Не указано'}</p>
                      <p>Доставка: {order.deliveryMethod}</p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setSelectedOrder(order)}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      Детали
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-4">У вас пока нет заказов</p>
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
    );
  };

  // Order Details Component
  const OrderDetails = ({ order, onBack }: { order: any; onBack: () => void }) => {
    return (
      <div className="min-h-screen bg-gray-50 pb-20">
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
    <div className="min-h-screen bg-gray-50 pb-20">
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
                  <div className="space-y-4">
                    {userFavorites.map((favorite: any) => (
                      <div key={favorite.id} className="border border-gray-200 rounded-lg overflow-hidden">
                        <BoxCard
                          box={favorite.box}
                          onSelect={handleSelectBox}
                          userId={userData?.id}
                          variant="default"
                        />
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
                  <div>
                    <Label htmlFor="message">Ваше сообщение</Label>
                    <Textarea
                      id="message"
                      placeholder="Опишите ваш вопрос..."
                      value={contactForm.message}
                      onChange={(e) => setContactForm(prev => ({ ...prev, message: e.target.value }))}
                      rows={6}
                    />
                  </div>
                  
                  <Button 
                    className="w-full bg-primary text-white"
                    onClick={() => {
                      if (!contactForm.message.trim()) {
                        alert('Пожалуйста, введите ваше сообщение');
                        return;
                      }
                      
                      const telegramUrl = `https://t.me/finessgod?text=${encodeURIComponent(contactForm.message)}`;
                      window.open(telegramUrl, '_blank');
                      
                      // Clear the form
                      setContactForm(prev => ({ ...prev, message: "" }));
                    }}
                  >
                    Отправить сообщение
                  </Button>
                </div>
              </div>
              
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h4 className="font-semibold mb-3">Другие способы связи</h4>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3 p-3 border rounded-lg">
                    <Phone className="w-5 h-5 text-primary" />
                    <div>
                      <p className="font-medium">По вопросам заказа и возврата</p>
                      <p className="text-sm text-gray-600">+7 925 131-51-01</p>
                      <p className="text-sm text-gray-600">sales@kavarabrand.com</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3 p-3 border rounded-lg">
                    <MessageCircle className="w-5 h-5 text-primary" />
                    <div>
                      <p className="font-medium">По вопросам сотрудничества</p>
                      <p className="text-sm text-gray-600">+7 916 091-56-54</p>
                      <p className="text-sm text-gray-600">info@kavarabrand.com</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3 p-3 border rounded-lg">
                    <MessageCircle className="w-5 h-5 text-primary" />
                    <div>
                      <p className="font-medium">Telegram канал</p>
                      <p className="text-sm text-gray-600">@kavarabrand</p>
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