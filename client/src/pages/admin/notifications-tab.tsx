import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Bell, ShoppingCart, CreditCard, Send, Clock, CheckCircle, AlertCircle, ArrowLeft, TestTube } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";

interface ReminderSetting {
  id: string;
  type: string;
  enabled: boolean;
  delayHours: number;
  messageTemplate: string;
  sentCount: number;
  convertedCount: number;
  maxReminders: number;
  minIntervalHours: number;
}

interface NotificationsTabProps {
  adminToken: string;
  onBack?: () => void;
}

export function NotificationsTab({ adminToken, onBack }: NotificationsTabProps) {
  const { toast } = useToast();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<ReminderSetting>>({});
  const [testDialogOpen, setTestDialogOpen] = useState(false);
  const [testUsername, setTestUsername] = useState("");

  const { data: settings, isLoading } = useQuery<ReminderSetting[]>({
    queryKey: ['/api/admin/reminder-settings'],
    queryFn: async () => {
      const response = await fetch('/api/admin/reminder-settings', {
        headers: { 'Authorization': `Bearer ${adminToken}` }
      });
      if (!response.ok) throw new Error('Failed to fetch settings');
      return response.json();
    }
  });

  const { data: stats } = useQuery({
    queryKey: ['/api/admin/reminder-stats'],
    queryFn: async () => {
      const response = await fetch('/api/admin/reminder-stats', {
        headers: { 'Authorization': `Bearer ${adminToken}` }
      });
      if (!response.ok) throw new Error('Failed to fetch stats');
      return response.json();
    }
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<ReminderSetting> }) => {
      const response = await fetch(`/api/admin/reminder-settings/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`
        },
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error('Failed to update setting');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/reminder-settings'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/reminder-stats'] });
      setEditingId(null);
      toast({ title: "Настройки сохранены" });
    }
  });

  const triggerMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/admin/trigger-reminders', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${adminToken}` }
      });
      if (!response.ok) throw new Error('Failed to trigger reminders');
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/reminder-stats'] });
      toast({ 
        title: "Проверка выполнена",
        description: `Отправлено напоминаний: ${data.sentCount}`
      });
    }
  });

  const testMutation = useMutation({
    mutationFn: async (username: string) => {
      const response = await fetch('/api/admin/test-reminder-buttons', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`
        },
        body: JSON.stringify({ username: username.replace('@', '') })
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to send test messages');
      }
      return response.json();
    },
    onSuccess: () => {
      setTestDialogOpen(false);
      setTestUsername("");
      toast({ 
        title: "Тестовые сообщения отправлены",
        description: "Проверьте Telegram"
      });
    },
    onError: (error: Error) => {
      toast({ 
        title: "Ошибка",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const handleToggle = (setting: ReminderSetting) => {
    updateMutation.mutate({
      id: setting.id,
      data: { enabled: !setting.enabled }
    });
  };

  const handleEdit = (setting: ReminderSetting) => {
    setEditingId(setting.id);
    setEditForm({
      delayHours: setting.delayHours,
      messageTemplate: setting.messageTemplate,
      maxReminders: setting.maxReminders,
      minIntervalHours: setting.minIntervalHours
    });
  };

  const handleSave = (id: string) => {
    updateMutation.mutate({ id, data: editForm });
  };

  const getTypeInfo = (type: string) => {
    switch (type) {
      case 'abandoned_cart':
        return {
          title: 'Брошенная корзина',
          description: 'Напоминание клиентам, которые добавили товары в корзину, но не оформили заказ',
          icon: ShoppingCart,
          color: 'text-orange-600'
        };
      case 'unpaid_order':
        return {
          title: 'Неоплаченный заказ',
          description: 'Напоминание клиентам, которые оформили заказ, но не оплатили',
          icon: CreditCard,
          color: 'text-red-600'
        };
      default:
        return {
          title: type,
          description: '',
          icon: Bell,
          color: 'text-gray-600'
        };
    }
  };

  if (isLoading) {
    return <div className="flex justify-center py-8">Загрузка...</div>;
  }

  return (
    <div className="space-y-6">
      {onBack && (
        <Button variant="outline" onClick={onBack} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Назад
        </Button>
      )}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Автоматические уведомления
          </CardTitle>
          <CardDescription>
            Настройте автоматические напоминания для увеличения конверсии
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2">
                  <Send className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="text-2xl font-bold">{stats?.stats?.totalSent || 0}</p>
                    <p className="text-sm text-gray-500">Отправлено</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="text-2xl font-bold">{stats?.stats?.totalConverted || 0}</p>
                    <p className="text-sm text-gray-500">Конверсий</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-purple-600" />
                  <div>
                    <p className="text-2xl font-bold">{stats?.stats?.conversionRate || 0}%</p>
                    <p className="text-sm text-gray-500">Конверсия</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="flex justify-end gap-2 mb-4">
            <Button 
              onClick={() => setTestDialogOpen(true)}
              variant="outline"
            >
              <TestTube className="h-4 w-4 mr-2" />
              Тест кнопок
            </Button>
            <Button 
              onClick={() => triggerMutation.mutate()}
              disabled={triggerMutation.isPending}
              variant="outline"
            >
              <Send className="h-4 w-4 mr-2" />
              Проверить сейчас
            </Button>
          </div>

          <Dialog open={testDialogOpen} onOpenChange={setTestDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Тестирование кнопок уведомлений</DialogTitle>
                <DialogDescription>
                  Введите @username в Telegram для отправки тестовых сообщений с кнопками
                </DialogDescription>
              </DialogHeader>
              <div className="py-4">
                <Input
                  placeholder="@username"
                  value={testUsername}
                  onChange={(e) => setTestUsername(e.target.value)}
                />
                <p className="text-sm text-gray-500 mt-2">
                  Будет отправлено 2 тестовых сообщения:
                </p>
                <ul className="text-sm text-gray-500 mt-1 list-disc list-inside">
                  <li>Брошенная корзина (с кнопкой "В корзину")</li>
                  <li>Неоплаченный заказ (с кнопкой "Оплатить")</li>
                </ul>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setTestDialogOpen(false)}>
                  Отмена
                </Button>
                <Button 
                  onClick={() => testMutation.mutate(testUsername)}
                  disabled={!testUsername.trim() || testMutation.isPending}
                >
                  {testMutation.isPending ? "Отправка..." : "Отправить тест"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <div className="space-y-4">
            {settings?.map((setting) => {
              const typeInfo = getTypeInfo(setting.type);
              const Icon = typeInfo.icon;
              const isEditing = editingId === setting.id;

              return (
                <Card key={setting.id} className={setting.enabled ? 'border-green-200' : ''}>
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4 flex-1">
                        <div className={`p-2 rounded-lg bg-gray-100 ${typeInfo.color}`}>
                          <Icon className="h-6 w-6" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold">{typeInfo.title}</h3>
                            {setting.enabled ? (
                              <Badge variant="outline" className="bg-green-50 text-green-700">Активно</Badge>
                            ) : (
                              <Badge variant="outline">Выключено</Badge>
                            )}
                          </div>
                          <p className="text-sm text-gray-500 mb-3">{typeInfo.description}</p>

                          {isEditing ? (
                            <div className="space-y-3">
                              <div className="flex items-center gap-2">
                                <Clock className="h-4 w-4 text-gray-400" />
                                <span className="text-sm">Задержка (часов):</span>
                                <Input
                                  type="number"
                                  min="1"
                                  max="48"
                                  value={editForm.delayHours}
                                  onChange={(e) => setEditForm({ ...editForm, delayHours: parseInt(e.target.value) })}
                                  className="w-20"
                                />
                              </div>
                              <div className="flex items-center gap-2">
                                <Bell className="h-4 w-4 text-gray-400" />
                                <span className="text-sm">Макс. напоминаний:</span>
                                <Input
                                  type="number"
                                  min="1"
                                  max="10"
                                  value={editForm.maxReminders}
                                  onChange={(e) => setEditForm({ ...editForm, maxReminders: parseInt(e.target.value) })}
                                  className="w-20"
                                />
                              </div>
                              <div className="flex items-center gap-2">
                                <Clock className="h-4 w-4 text-gray-400" />
                                <span className="text-sm">Интервал между (ч):</span>
                                <Input
                                  type="number"
                                  min="1"
                                  max="168"
                                  value={editForm.minIntervalHours}
                                  onChange={(e) => setEditForm({ ...editForm, minIntervalHours: parseInt(e.target.value) })}
                                  className="w-20"
                                />
                              </div>
                              <div>
                                <p className="text-sm mb-1">Текст сообщения:</p>
                                <Textarea
                                  value={editForm.messageTemplate}
                                  onChange={(e) => setEditForm({ ...editForm, messageTemplate: e.target.value })}
                                  rows={3}
                                />
                              </div>
                              <div className="flex gap-2">
                                <Button size="sm" onClick={() => handleSave(setting.id)}>
                                  Сохранить
                                </Button>
                                <Button size="sm" variant="outline" onClick={() => setEditingId(null)}>
                                  Отмена
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <div className="space-y-2">
                              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                                <div className="flex items-center gap-1">
                                  <Clock className="h-4 w-4" />
                                  Через {setting.delayHours} ч.
                                </div>
                                <div className="flex items-center gap-1">
                                  <Bell className="h-4 w-4" />
                                  Макс. {setting.maxReminders} раз
                                </div>
                                <div className="flex items-center gap-1">
                                  <Clock className="h-4 w-4" />
                                  Интервал {setting.minIntervalHours} ч.
                                </div>
                              </div>
                              <p className="text-sm bg-gray-50 p-2 rounded">{setting.messageTemplate}</p>
                              <div className="flex gap-4 text-sm text-gray-500">
                                <span>Отправлено: {setting.sentCount}</span>
                                <span>Конверсий: {setting.convertedCount}</span>
                              </div>
                              <Button size="sm" variant="outline" onClick={() => handleEdit(setting)}>
                                Редактировать
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                      <Switch
                        checked={setting.enabled}
                        onCheckedChange={() => handleToggle(setting)}
                      />
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {stats?.recentReminders && stats.recentReminders.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Последние отправленные</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {stats.recentReminders.map((reminder: any) => (
                <div key={reminder.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    {reminder.type === 'abandoned_cart' ? (
                      <ShoppingCart className="h-4 w-4 text-orange-600" />
                    ) : (
                      <CreditCard className="h-4 w-4 text-red-600" />
                    )}
                    <div>
                      <p className="text-sm font-medium">
                        {reminder.user?.username || reminder.user?.firstName || 'Пользователь'}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(reminder.sentAt).toLocaleString('ru-RU')}
                      </p>
                    </div>
                  </div>
                  {reminder.converted && (
                    <Badge variant="outline" className="bg-green-50 text-green-700">
                      Конвертирован
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
