import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Plus, Gift, BarChart3, Calendar, Percent, ExternalLink } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface PromoCode {
  id: string;
  code: string;
  discountPercent: number;
  maxUses: number;
  usedCount: number;
  isActive: boolean;
  partnerName: string;
  partnerContact: string;
  createdAt: string;
  expiresAt?: string;
  orders?: any[];
  owner?: {
    id: string;
    telegramId?: string;
    username?: string;
    firstName?: string;
    lastName?: string;
  };
  pointsPerUse: number;
  rewardPercent: number;
}

interface PromoCodeFormData {
  code: string;
  discountPercent: number;
  maxUses: number;
  partnerName: string;
  partnerContact: string;
  expiresAt?: string;
  ownerIdentifier?: string;
  pointsPerUse: number;
  rewardPercent: number;
}

interface PromoCodeUsage {
  id: string;
  createdAt: string;
  orderAmount: number;
  discountAmount: number;
  pointsAwarded: number;
  user?: {
    id: string;
    telegramId?: string;
    username?: string;
    firstName?: string;
    lastName?: string;
  };
  order?: {
    id: string;
    orderNumber: string;
    totalPrice: number;
    discountAmount?: number;
    status: string;
    createdAt: string;
  };
}

export default function PromoCodes({ onBack }: { onBack: () => void }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [selectedPromoCode, setSelectedPromoCode] = useState<PromoCode | null>(null);
  const [formData, setFormData] = useState<PromoCodeFormData>({
    code: '',
    discountPercent: 10,
    maxUses: 100,
    partnerName: '',
    partnerContact: '',
    expiresAt: '',
    ownerIdentifier: '',
    pointsPerUse: 0,
    rewardPercent: 0
  });

  const { data: promoCodes, isLoading } = useQuery<PromoCode[]>({
    queryKey: ["/api/admin/promo-codes"],
    retry: false,
  });

  const { data: usageStats, isLoading: isLoadingUsage } = useQuery<PromoCodeUsage[]>({
    queryKey: [`/api/admin/promo-codes/${selectedPromoCode?.id}/usage`],
    enabled: !!selectedPromoCode,
    retry: false,
  });

  const createPromoCodeMutation = useMutation({
    mutationFn: async (data: PromoCodeFormData) => {
      return await apiRequest("POST", "/api/admin/promo-codes", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/promo-codes"] });
      setShowForm(false);
      setFormData({
        code: '',
        discountPercent: 10,
        maxUses: 100,
        partnerName: '',
        partnerContact: '',
        expiresAt: '',
        ownerIdentifier: '',
        pointsPerUse: 0,
        rewardPercent: 0
      });
      toast({
        title: "Промокод создан",
        description: "Новый промокод успешно добавлен в систему"
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Ошибка создания промокода",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const togglePromoCodeMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      return await apiRequest("PUT", `/api/admin/promo-codes/${id}/toggle`, { isActive });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/promo-codes"] });
      toast({
        title: "Статус обновлен",
        description: "Статус промокода успешно изменен"
      });
    }
  });

  const generateRandomCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormData({ ...formData, code: result });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields
    if (!formData.code || !formData.partnerName || !formData.partnerContact) {
      toast({
        title: "Ошибка валидации",
        description: "Заполните все обязательные поля: код, название партнера, контакты",
        variant: "destructive"
      });
      return;
    }

    // Validate pointsPerUse
    if (formData.pointsPerUse < 0) {
      toast({
        title: "Ошибка валидации",
        description: "Количество баллов не может быть отрицательным",
        variant: "destructive"
      });
      return;
    }

    // Validate discount percent
    if (formData.discountPercent < 0 || formData.discountPercent > 100) {
      toast({
        title: "Ошибка валидации",
        description: "Размер скидки должен быть от 0 до 100%",
        variant: "destructive"
      });
      return;
    }

    createPromoCodeMutation.mutate(formData);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-black border-t-transparent rounded-full" />
      </div>
    );
  }

  // Показать детали промокода с заказами
  if (selectedPromoCode) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-4 mb-6">
            <Button 
              variant="outline" 
              onClick={() => setSelectedPromoCode(null)}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Назад к промокодам
            </Button>
            <h1 className="text-2xl font-bold">Промокод: {selectedPromoCode.code}</h1>
          </div>

          <div className="grid md:grid-cols-3 gap-6 mb-6">
            <Card>
              <CardContent className="p-6 text-center">
                <Percent className="h-8 w-8 mx-auto mb-2 text-green-500" />
                <div className="text-2xl font-bold">{selectedPromoCode.discountPercent}%</div>
                <p className="text-sm text-muted-foreground">Размер скидки</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6 text-center">
                <BarChart3 className="h-8 w-8 mx-auto mb-2 text-blue-500" />
                <div className="text-2xl font-bold">{selectedPromoCode.usedCount} / {selectedPromoCode.maxUses}</div>
                <p className="text-sm text-muted-foreground">Использований</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6 text-center">
                <Calendar className="h-8 w-8 mx-auto mb-2 text-purple-500" />
                <div className="text-2xl font-bold">
                  {selectedPromoCode.expiresAt 
                    ? new Date(selectedPromoCode.expiresAt).toLocaleDateString('ru-RU')
                    : 'Бессрочно'
                  }
                </div>
                <p className="text-sm text-muted-foreground">Срок действия</p>
              </CardContent>
            </Card>
          </div>

          {/* Promo Code Details */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Информация о промокоде</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4">
                {selectedPromoCode.owner && (
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Владелец</Label>
                    <p className="text-lg font-medium">
                      {selectedPromoCode.owner.firstName || selectedPromoCode.owner.username || `User #${selectedPromoCode.owner.telegramId}`}
                    </p>
                    <p className="text-sm text-gray-500">
                      @{selectedPromoCode.owner.username || selectedPromoCode.owner.telegramId}
                    </p>
                  </div>
                )}
                {selectedPromoCode.pointsPerUse > 0 && (
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Баллы за использование</Label>
                    <p className="text-lg font-medium text-blue-600">
                      +{selectedPromoCode.pointsPerUse} баллов владельцу
                    </p>
                  </div>
                )}
                <div>
                  <Label className="text-sm font-medium text-gray-600">Тип промокода</Label>
                  <p className="text-lg">
                    {selectedPromoCode.owner ? 'Реферальный' : 'Стандартный'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Partner Info - only show if data exists */}
          {(selectedPromoCode.partnerName || selectedPromoCode.partnerContact) && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Информация о партнере</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-4">
                  {selectedPromoCode.partnerName && (
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Название партнера</Label>
                      <p className="text-lg">{selectedPromoCode.partnerName}</p>
                    </div>
                  )}
                  {selectedPromoCode.partnerContact && (
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Контакты</Label>
                      <p className="text-lg">{selectedPromoCode.partnerContact}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>История использования промокода</CardTitle>
              <CardDescription>Кто и когда использовал промокод</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingUsage ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin w-8 h-8 border-4 border-black border-t-transparent rounded-full" />
                </div>
              ) : usageStats && usageStats.length > 0 ? (
                <div className="space-y-4">
                  {usageStats.map((usage) => {
                    const getStatusBadge = (status: string) => {
                      const statusConfig = {
                        'pending': { label: 'Ожидает оплаты', variant: 'secondary' as const },
                        'paid': { label: 'Оплачен', variant: 'default' as const },
                        'processing': { label: 'В обработке', variant: 'default' as const },
                        'shipped': { label: 'Отправлен', variant: 'default' as const },
                        'delivered': { label: 'Доставлен', variant: 'default' as const },
                        'cancelled': { label: 'Отменен', variant: 'destructive' as const }
                      };
                      const config = statusConfig[status as keyof typeof statusConfig] || { label: status, variant: 'secondary' as const };
                      return <Badge variant={config.variant}>{config.label}</Badge>;
                    };

                    return (
                      <div key={usage.id} className="p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="font-medium">
                                {usage.user?.firstName || usage.user?.username || (usage.user ? `User #${usage.user.telegramId}` : 'Неизвестный пользователь')}
                              </p>
                              {usage.user?.username && (
                                <span className="text-xs text-gray-500">@{usage.user.username}</span>
                              )}
                            </div>
                            {usage.order ? (
                              <div className="flex items-center gap-2 mb-1">
                                <p className="text-sm text-gray-600">Заказ #{usage.order.orderNumber}</p>
                                {getStatusBadge(usage.order.status)}
                              </div>
                            ) : (
                              <p className="text-sm text-gray-500">Заказ удален</p>
                            )}
                            <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
                              <span>Использован: {new Date(usage.createdAt).toLocaleString('ru-RU')}</span>
                              {usage.order?.createdAt && (
                                <span>Создан: {new Date(usage.order.createdAt).toLocaleString('ru-RU')}</span>
                              )}
                            </div>
                          </div>
                          <div className="text-right ml-4">
                            <p className="font-bold text-lg">{usage.orderAmount}₽</p>
                            <p className="text-sm text-green-600">
                              Скидка: {usage.discountAmount}₽
                            </p>
                            {usage.pointsAwarded > 0 && (
                              <p className="text-xs text-blue-600 mt-1">
                                +{usage.pointsAwarded} баллов владельцу
                              </p>
                            )}
                          </div>
                        </div>
                        {usage.order && (
                          <div className="flex justify-end pt-2 border-t">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                              onClick={() => {
                                // Navigate to order details
                                window.location.href = `/admin/orders/${usage.order!.id}`;
                              }}
                            >
                              <ExternalLink className="h-4 w-4 mr-1" />
                              Детали заказа
                            </Button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Gift className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <p className="text-gray-500">Промокод еще не использовался</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button 
              variant="outline" 
              onClick={onBack}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Назад
            </Button>
            <h1 className="text-2xl font-bold">Управление промокодами</h1>
          </div>
          <Button 
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Создать промокод
          </Button>
        </div>

        {showForm && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Создать новый промокод</CardTitle>
              <CardDescription>Создайте промокод для партнера</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="code">Код промокода *</Label>
                    <div className="flex gap-2">
                      <Input
                        id="code"
                        value={formData.code}
                        onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                        placeholder="PARTNER2024"
                        className="uppercase"
                      />
                      <Button type="button" variant="outline" onClick={generateRandomCode}>
                        Сгенерировать
                      </Button>
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="discount">Размер скидки (%)</Label>
                    <Input
                      id="discount"
                      type="number"
                      min="1"
                      max="50"
                      value={formData.discountPercent}
                      onChange={(e) => setFormData({ ...formData, discountPercent: parseInt(e.target.value) })}
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="maxUses">Максимум использований</Label>
                    <Input
                      id="maxUses"
                      type="number"
                      min="1"
                      value={formData.maxUses}
                      onChange={(e) => setFormData({ ...formData, maxUses: parseInt(e.target.value) })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="expires">Срок действия (необязательно)</Label>
                    <Input
                      id="expires"
                      type="date"
                      value={formData.expiresAt}
                      onChange={(e) => setFormData({ ...formData, expiresAt: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="partnerName">Название партнера *</Label>
                    <Input
                      id="partnerName"
                      value={formData.partnerName}
                      onChange={(e) => setFormData({ ...formData, partnerName: e.target.value })}
                      placeholder="Фитнес-клуб Спортлайф"
                    />
                  </div>
                  <div>
                    <Label htmlFor="partnerContact">Контакты партнера *</Label>
                    <Input
                      id="partnerContact"
                      value={formData.partnerContact}
                      onChange={(e) => setFormData({ ...formData, partnerContact: e.target.value })}
                      placeholder="@username или +7 XXX XXX XX XX"
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="ownerIdentifier">Владелец промокода (необязательно)</Label>
                    <Input
                      id="ownerIdentifier"
                      value={formData.ownerIdentifier}
                      onChange={(e) => setFormData({ ...formData, ownerIdentifier: e.target.value })}
                      placeholder="Telegram ID или @username"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Укажите Telegram ID или username пользователя, который получит баллы
                    </p>
                  </div>
                  <div>
                    <Label htmlFor="pointsPerUse">Баллов за использование (фиксировано)</Label>
                    <Input
                      id="pointsPerUse"
                      type="number"
                      min="0"
                      value={formData.pointsPerUse}
                      onChange={(e) => setFormData({ ...formData, pointsPerUse: parseInt(e.target.value) || 0 })}
                      placeholder="0"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Фиксированные баллы за каждое использование
                    </p>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="rewardPercent">% вознаграждения от суммы заказа</Label>
                    <Input
                      id="rewardPercent"
                      type="number"
                      min="0"
                      max="100"
                      step="0.1"
                      value={formData.rewardPercent}
                      onChange={(e) => setFormData({ ...formData, rewardPercent: parseFloat(e.target.value) || 0 })}
                      placeholder="0"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Процент от суммы заказа, который начисляется баллами владельцу (например, 5 = 5%)
                    </p>
                  </div>
                  <div className="flex items-center">
                    <p className="text-sm text-gray-600 bg-blue-50 p-3 rounded-lg border border-blue-200">
                      💡 Если указан процент вознаграждения, владелец получит баллы от суммы заказа. Если указаны фиксированные баллы - фиксированную сумму за использование.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <Button 
                    type="submit" 
                    disabled={createPromoCodeMutation.isPending}
                    className="flex items-center gap-2"
                  >
                    <Gift className="h-4 w-4" />
                    Создать промокод
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setShowForm(false)}
                  >
                    Отмена
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Активные промокоды</CardTitle>
            <CardDescription>Управляйте промокодами для партнеров</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {promoCodes && promoCodes.length > 0 ? (
                promoCodes.map((promoCode) => (
                  <div key={promoCode.id} className="flex justify-between items-center p-4 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-4 mb-2">
                        <code className="px-2 py-1 bg-gray-100 rounded font-mono font-bold">
                          {promoCode.code}
                        </code>
                        <Badge variant={promoCode.isActive ? "default" : "secondary"}>
                          {promoCode.isActive ? "Активен" : "Неактивен"}
                        </Badge>
                        <span className="text-sm text-gray-600">
                          {promoCode.discountPercent}% скидка
                        </span>
                      </div>
                      <p className="font-medium">{promoCode.partnerName}</p>
                      <p className="text-sm text-gray-600">{promoCode.partnerContact}</p>
                      {promoCode.owner && (
                        <p className="text-sm text-blue-600 mt-1">
                          Владелец: {promoCode.owner.firstName || promoCode.owner.username || promoCode.owner.telegramId} 
                          {promoCode.pointsPerUse > 0 && ` (${promoCode.pointsPerUse} баллов за использование)`}
                        </p>
                      )}
                      <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                        <span>Использований: {promoCode.usedCount} / {promoCode.maxUses}</span>
                        <span>
                          Создан: {new Date(promoCode.createdAt).toLocaleDateString('ru-RU')}
                        </span>
                        {promoCode.expiresAt && (
                          <span>
                            Истекает: {new Date(promoCode.expiresAt).toLocaleDateString('ru-RU')}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedPromoCode(promoCode)}
                      >
                        <BarChart3 className="h-4 w-4" />
                        Статистика
                      </Button>
                      <Button
                        variant={promoCode.isActive ? "destructive" : "default"}
                        size="sm"
                        onClick={() => togglePromoCodeMutation.mutate({ 
                          id: promoCode.id, 
                          isActive: !promoCode.isActive 
                        })}
                      >
                        {promoCode.isActive ? "Деактивировать" : "Активировать"}
                      </Button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <Gift className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <p className="text-gray-500">Промокоды не созданы</p>
                  <p className="text-sm text-gray-400 mt-1">Создайте первый промокод для партнера</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}