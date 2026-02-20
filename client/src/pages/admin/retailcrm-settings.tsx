import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Settings, Save, TestTube, CheckCircle, AlertCircle, Loader2, Users, ShoppingBag, RefreshCw, Gift } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";

interface RetailCRMSettings {
  enabled: boolean;
  apiUrl: string;
  hasApiKey: boolean;
  siteCode: string;
  syncedOrdersCount: number;
  syncedCustomersCount: number;
  lastSyncAt: string | null;
}

interface FormData {
  isEnabled: boolean;
  apiUrl: string;
  apiKey: string;
  siteCode: string;
}

interface RetailCRMSettingsProps {
  adminToken: string;
  onBack?: () => void;
}

export function RetailCRMSettings({ adminToken, onBack }: RetailCRMSettingsProps) {
  const { toast } = useToast();
  const [formData, setFormData] = useState<FormData>({
    isEnabled: false,
    apiUrl: '',
    apiKey: '',
    siteCode: ''
  });
  const [isEditing, setIsEditing] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [isSyncingCustomers, setIsSyncingCustomers] = useState(false);
  const [isSyncingOrders, setIsSyncingOrders] = useState(false);
  const [isRecalculating, setIsRecalculating] = useState(false);
  const [isAwardingPoints, setIsAwardingPoints] = useState(false);
  const [awardUsername, setAwardUsername] = useState('');
  const [awardPoints, setAwardPoints] = useState('');
  const [awardDescription, setAwardDescription] = useState('');

  const { data: settings, isLoading } = useQuery<RetailCRMSettings>({
    queryKey: ['/api/admin/retailcrm/settings'],
    queryFn: async () => {
      const response = await fetch('/api/admin/retailcrm/settings', {
        headers: { 'Authorization': `Bearer ${adminToken}` }
      });
      if (!response.ok) {
        if (response.status === 404) {
          return null;
        }
        throw new Error('Failed to fetch settings');
      }
      return response.json();
    }
  });

  const saveMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const response = await fetch('/api/admin/retailcrm/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`
        },
        body: JSON.stringify({
          enabled: data.isEnabled,
          apiUrl: data.apiUrl,
          apiKey: data.apiKey,
          siteCode: data.siteCode
        })
      });
      if (!response.ok) throw new Error('Failed to save settings');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/retailcrm/settings'] });
      toast({ title: "Настройки сохранены" });
      setIsEditing(false);
    },
    onError: (error: Error) => {
      toast({ 
        title: "Ошибка сохранения", 
        description: error.message || "Не удалось сохранить настройки",
        variant: "destructive" 
      });
    }
  });

  const testConnection = async () => {
    setIsTesting(true);
    try {
      const response = await fetch('/api/admin/retailcrm/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`
        },
        body: JSON.stringify({})
      });
      const result = await response.json();
      if (response.ok && result.success) {
        toast({ title: "Подключение успешно", description: "RetailCRM API доступен" });
      } else {
        toast({ 
          title: "Ошибка подключения", 
          description: result.message || "Не удалось подключиться к RetailCRM",
          variant: "destructive" 
        });
      }
    } catch {
      toast({ title: "Ошибка подключения", variant: "destructive" });
    } finally {
      setIsTesting(false);
    }
  };

  const syncCustomers = async () => {
    setIsSyncingCustomers(true);
    try {
      const response = await fetch('/api/admin/retailcrm/sync-customers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`
        }
      });
      const result = await response.json();
      if (response.ok && result.success) {
        const desc = result.message + (result.errorMessages?.length ? `\n${result.errorMessages.join('\n')}` : '');
        toast({ title: "Синхронизация завершена", description: desc });
        queryClient.invalidateQueries({ queryKey: ['/api/admin/retailcrm/settings'] });
      } else {
        toast({ 
          title: "Ошибка синхронизации", 
          description: result.message || "Не удалось синхронизировать клиентов",
          variant: "destructive" 
        });
      }
    } catch {
      toast({ title: "Ошибка синхронизации", variant: "destructive" });
    } finally {
      setIsSyncingCustomers(false);
    }
  };

  const syncOrders = async () => {
    setIsSyncingOrders(true);
    try {
      const response = await fetch('/api/admin/retailcrm/sync-orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`
        }
      });
      const result = await response.json();
      if (response.ok && result.success) {
        const desc = result.message + (result.errors?.length ? `\n${result.errors.join('\n')}` : '');
        toast({ title: "Синхронизация завершена", description: desc });
        queryClient.invalidateQueries({ queryKey: ['/api/admin/retailcrm/settings'] });
      } else {
        toast({ 
          title: "Ошибка синхронизации", 
          description: result.message || "Не удалось синхронизировать заказы",
          variant: "destructive" 
        });
      }
    } catch {
      toast({ title: "Ошибка синхронизации", variant: "destructive" });
    } finally {
      setIsSyncingOrders(false);
    }
  };

  const recalculateLoyalty = async () => {
    setIsRecalculating(true);
    try {
      const response = await fetch('/api/admin/recalculate-loyalty', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`
        }
      });
      const result = await response.json();
      if (response.ok && result.success) {
        toast({ title: "Пересчёт завершён", description: result.message });
      } else {
        toast({ 
          title: "Ошибка пересчёта", 
          description: result.message || "Не удалось пересчитать баллы",
          variant: "destructive" 
        });
      }
    } catch {
      toast({ title: "Ошибка пересчёта", variant: "destructive" });
    } finally {
      setIsRecalculating(false);
    }
  };

  const awardPointsToUser = async () => {
    if (!awardUsername.trim() || !awardPoints.trim()) {
      toast({ title: "Заполните username и баллы", variant: "destructive" });
      return;
    }
    setIsAwardingPoints(true);
    try {
      const response = await fetch('/api/admin/award-points', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`
        },
        body: JSON.stringify({
          username: awardUsername.trim(),
          points: awardPoints.trim(),
          description: awardDescription.trim() || undefined
        })
      });
      const result = await response.json();
      if (response.ok && result.success) {
        toast({ title: "Баллы начислены", description: result.message });
        setAwardUsername('');
        setAwardPoints('');
        setAwardDescription('');
      } else {
        toast({ 
          title: "Ошибка", 
          description: result.message || "Не удалось начислить баллы",
          variant: "destructive" 
        });
      }
    } catch {
      toast({ title: "Ошибка начисления", variant: "destructive" });
    } finally {
      setIsAwardingPoints(false);
    }
  };

  const handleStartEdit = () => {
    setFormData({
      isEnabled: settings?.enabled ?? false,
      apiUrl: settings?.apiUrl ?? '',
      apiKey: '',
      siteCode: settings?.siteCode ?? 'default'
    });
    setIsEditing(true);
  };

  const handleSave = () => {
    saveMutation.mutate(formData);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="retailcrm-settings">
      <div className="flex items-center gap-4">
        {onBack && (
          <Button variant="ghost" size="sm" onClick={onBack} data-testid="button-back">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Назад
          </Button>
        )}
        <div>
          <h2 className="text-2xl font-bold">RetailCRM</h2>
          <p className="text-gray-500">Интеграция с RetailCRM для синхронизации заказов</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Settings className="h-5 w-5 text-blue-600" />
              <div>
                <CardTitle>Настройки интеграции</CardTitle>
                <CardDescription>API ключ и URL для подключения к RetailCRM</CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {settings?.enabled ? (
                <Badge variant="default" className="bg-green-600">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Активно
                </Badge>
              ) : (
                <Badge variant="secondary">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  Отключено
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {!isEditing ? (
            <>
              <div className="grid gap-4">
                <div>
                  <Label className="text-gray-500">API URL</Label>
                  <p className="font-mono text-sm">{settings?.apiUrl || 'Не настроен'}</p>
                </div>
                <div>
                  <Label className="text-gray-500">API Key</Label>
                  <p className="font-mono text-sm">
                    {settings?.hasApiKey ? '••••••••••••' : 'Не настроен'}
                  </p>
                </div>
                <div>
                  <Label className="text-gray-500">Код сайта</Label>
                  <p className="font-mono text-sm">{settings?.siteCode || 'default'}</p>
                </div>
                {settings?.lastSyncAt && (
                  <div>
                    <Label className="text-gray-500">Последняя синхронизация</Label>
                    <p className="text-sm">{new Date(settings.lastSyncAt).toLocaleString('ru-RU')}</p>
                  </div>
                )}
                {(settings?.syncedOrdersCount || settings?.syncedCustomersCount) && (
                  <div className="flex gap-4">
                    <div>
                      <Label className="text-gray-500">Синхр. заказов</Label>
                      <p className="text-sm font-medium">{settings?.syncedOrdersCount || 0}</p>
                    </div>
                    <div>
                      <Label className="text-gray-500">Синхр. клиентов</Label>
                      <p className="text-sm font-medium">{settings?.syncedCustomersCount || 0}</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <Button onClick={handleStartEdit} data-testid="button-edit-settings">
                  <Settings className="h-4 w-4 mr-2" />
                  Редактировать
                </Button>
                {settings?.apiUrl && settings?.hasApiKey && (
                  <>
                    <Button 
                      variant="outline" 
                      onClick={testConnection}
                      disabled={isTesting}
                      data-testid="button-test-connection"
                    >
                      {isTesting ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <TestTube className="h-4 w-4 mr-2" />
                      )}
                      Проверить подключение
                    </Button>
                    {settings?.enabled && (
                      <>
                        <Button 
                          variant="outline" 
                          onClick={syncOrders}
                          disabled={isSyncingOrders}
                          data-testid="button-sync-orders"
                        >
                          {isSyncingOrders ? (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          ) : (
                            <ShoppingBag className="h-4 w-4 mr-2" />
                          )}
                          Синхр. заказов
                        </Button>
                        <Button 
                          variant="outline" 
                          onClick={syncCustomers}
                          disabled={isSyncingCustomers}
                          data-testid="button-sync-customers"
                        >
                          {isSyncingCustomers ? (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          ) : (
                            <Users className="h-4 w-4 mr-2" />
                          )}
                          Синхр. клиентов
                        </Button>
                      </>
                    )}
                  </>
                )}
              </div>
            </>
          ) : (
            <>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="enabled">Включить интеграцию</Label>
                  <Switch
                    id="enabled"
                    checked={formData.isEnabled ?? false}
                    onCheckedChange={(checked) => setFormData({ ...formData, isEnabled: checked })}
                    data-testid="switch-enabled"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="apiUrl">API URL</Label>
                  <Input
                    id="apiUrl"
                    placeholder="https://your-store.retailcrm.ru"
                    value={formData.apiUrl ?? ''}
                    onChange={(e) => setFormData({ ...formData, apiUrl: e.target.value })}
                    data-testid="input-api-url"
                  />
                  <p className="text-xs text-gray-500">URL вашего RetailCRM (без /api/v5)</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="apiKey">API Key</Label>
                  <Input
                    id="apiKey"
                    type="password"
                    placeholder="Введите API ключ"
                    value={formData.apiKey ?? ''}
                    onChange={(e) => setFormData({ ...formData, apiKey: e.target.value })}
                    data-testid="input-api-key"
                  />
                  <p className="text-xs text-gray-500">API ключ из настроек RetailCRM</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="siteCode">Код сайта</Label>
                  <Input
                    id="siteCode"
                    placeholder="default"
                    value={formData.siteCode ?? ''}
                    onChange={(e) => setFormData({ ...formData, siteCode: e.target.value })}
                    data-testid="input-site-code"
                  />
                  <p className="text-xs text-gray-500">Код сайта/магазина в RetailCRM (если используется)</p>
                </div>
              </div>

              <div className="flex gap-2">
                <Button 
                  onClick={handleSave}
                  disabled={saveMutation.isPending}
                  data-testid="button-save-settings"
                >
                  {saveMutation.isPending ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  Сохранить
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setIsEditing(false)}
                  data-testid="button-cancel"
                >
                  Отмена
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Как это работает</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-gray-600">
          <p>После настройки интеграции:</p>
          <ul className="list-disc list-inside space-y-2">
            <li>Новые заказы автоматически отправляются в RetailCRM</li>
            <li>При оплате заказа статус обновляется в RetailCRM</li>
            <li>Клиенты создаются/обновляются автоматически</li>
          </ul>
          <p className="text-amber-600">
            Интеграция не блокирует работу магазина — если RetailCRM недоступен, заказы все равно создаются.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <Gift className="h-5 w-5 text-purple-600" />
            <div>
              <CardTitle>Начисление баллов</CardTitle>
              <CardDescription>Начислить или списать баллы лояльности по username</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3">
            <div className="space-y-1">
              <Label htmlFor="award-username">Username</Label>
              <Input
                id="award-username"
                placeholder="@username или username"
                value={awardUsername}
                onChange={(e) => setAwardUsername(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="award-points">Баллы</Label>
              <Input
                id="award-points"
                type="number"
                placeholder="500 (или -100 для списания)"
                value={awardPoints}
                onChange={(e) => setAwardPoints(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="award-description">Причина (необязательно)</Label>
              <Input
                id="award-description"
                placeholder="Бонус за покупку"
                value={awardDescription}
                onChange={(e) => setAwardDescription(e.target.value)}
              />
            </div>
          </div>
          <Button 
            onClick={awardPointsToUser}
            disabled={isAwardingPoints || !awardUsername.trim() || !awardPoints.trim()}
            className="w-full"
          >
            {isAwardingPoints ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Gift className="h-4 w-4 mr-2" />
            )}
            Начислить баллы
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <RefreshCw className="h-5 w-5 text-orange-600" />
            <div>
              <CardTitle>Пересчёт баллов лояльности</CardTitle>
              <CardDescription>Пересчитать баланс баллов у всех клиентов на основе реальных транзакций</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-gray-600">
            Пересчёт суммирует все начисления и списания из истории транзакций и устанавливает актуальный баланс. 
            Уже потраченные баллы не вернутся — учитываются только реальные операции.
          </p>
          <Button 
            variant="outline"
            onClick={recalculateLoyalty}
            disabled={isRecalculating}
            className="w-full"
            data-testid="button-recalculate-loyalty"
          >
            {isRecalculating ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            Пересчитать баллы
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
