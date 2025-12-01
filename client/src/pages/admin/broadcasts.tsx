import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Plus, Send, Eye, Trash2, Megaphone, Users, CheckCircle, XCircle, Clock, Image, Link } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface BroadcastButton {
  label: string;
  startAppParam: string;
}

interface Broadcast {
  id: string;
  title: string;
  message: string;
  imageUrl?: string | null;
  buttons: BroadcastButton[];
  status: 'draft' | 'sending' | 'sent' | 'failed';
  sentCount: number;
  failedCount: number;
  totalRecipients: number;
  createdAt: string;
  sentAt?: string | null;
}

const PAGE_PRESETS = [
  { label: "Каталог", param: "catalog" },
  { label: "Боксы", param: "boxes" },
  { label: "Корзина", param: "cart" },
  { label: "Профиль", param: "profile" },
  { label: "Избранное", param: "favorites" },
  { label: "Квиз", param: "quiz" },
];

export default function Broadcasts({ onBack }: { onBack: () => void }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingBroadcast, setEditingBroadcast] = useState<Broadcast | null>(null);
  const [previewTelegramId, setPreviewTelegramId] = useState("");
  
  const [formData, setFormData] = useState({
    title: "",
    message: "",
    imageUrl: "",
    buttons: [] as BroadcastButton[]
  });
  
  const [newButton, setNewButton] = useState({ label: "", startAppParam: "" });

  const { data: broadcasts, isLoading } = useQuery<Broadcast[]>({
    queryKey: ["/api/admin/broadcasts"],
    retry: false,
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      return await apiRequest("POST", "/api/admin/broadcasts", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/broadcasts"] });
      resetForm();
      toast({ title: "Рассылка создана", description: "Черновик сохранен" });
    },
    onError: (error: Error) => {
      toast({ title: "Ошибка", description: error.message, variant: "destructive" });
    }
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: typeof formData }) => {
      return await apiRequest("PUT", `/api/admin/broadcasts/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/broadcasts"] });
      resetForm();
      toast({ title: "Рассылка обновлена" });
    },
    onError: (error: Error) => {
      toast({ title: "Ошибка", description: error.message, variant: "destructive" });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/admin/broadcasts/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/broadcasts"] });
      toast({ title: "Рассылка удалена" });
    },
    onError: (error: Error) => {
      toast({ title: "Ошибка", description: error.message, variant: "destructive" });
    }
  });

  const sendMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("POST", `/api/admin/broadcasts/${id}/send`);
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/broadcasts"] });
      toast({ 
        title: "Рассылка запущена", 
        description: `Отправка ${data.totalRecipients} пользователям` 
      });
    },
    onError: (error: Error) => {
      toast({ title: "Ошибка отправки", description: error.message, variant: "destructive" });
    }
  });

  const previewMutation = useMutation({
    mutationFn: async ({ id, telegramId }: { id: string; telegramId: string }) => {
      return await apiRequest("POST", `/api/admin/broadcasts/${id}/preview`, { telegramId });
    },
    onSuccess: () => {
      toast({ title: "Превью отправлено", description: "Проверьте сообщение в Telegram" });
    },
    onError: (error: Error) => {
      toast({ title: "Ошибка", description: error.message, variant: "destructive" });
    }
  });

  const resetForm = () => {
    setFormData({ title: "", message: "", imageUrl: "", buttons: [] });
    setNewButton({ label: "", startAppParam: "" });
    setShowForm(false);
    setEditingBroadcast(null);
  };

  const handleEdit = (broadcast: Broadcast) => {
    setEditingBroadcast(broadcast);
    setFormData({
      title: broadcast.title,
      message: broadcast.message,
      imageUrl: broadcast.imageUrl || "",
      buttons: broadcast.buttons || []
    });
    setShowForm(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || !formData.message) {
      toast({ title: "Ошибка", description: "Заполните название и текст", variant: "destructive" });
      return;
    }
    
    if (editingBroadcast) {
      updateMutation.mutate({ id: editingBroadcast.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const addButton = () => {
    if (newButton.label && newButton.startAppParam) {
      setFormData({
        ...formData,
        buttons: [...formData.buttons, { ...newButton }]
      });
      setNewButton({ label: "", startAppParam: "" });
    }
  };

  const removeButton = (index: number) => {
    setFormData({
      ...formData,
      buttons: formData.buttons.filter((_, i) => i !== index)
    });
  };

  const getStatusBadge = (status: Broadcast['status']) => {
    switch (status) {
      case 'draft':
        return <Badge variant="outline" className="bg-gray-50"><Clock className="w-3 h-3 mr-1" />Черновик</Badge>;
      case 'sending':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700"><Send className="w-3 h-3 mr-1" />Отправляется</Badge>;
      case 'sent':
        return <Badge variant="outline" className="bg-green-50 text-green-700"><CheckCircle className="w-3 h-3 mr-1" />Отправлено</Badge>;
      case 'failed':
        return <Badge variant="outline" className="bg-red-50 text-red-700"><XCircle className="w-3 h-3 mr-1" />Ошибка</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-black border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button variant="outline" onClick={onBack} className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Назад
            </Button>
            <h1 className="text-2xl font-bold">Рассылки</h1>
          </div>
          <Button onClick={() => setShowForm(true)} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Создать рассылку
          </Button>
        </div>

        {showForm && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>{editingBroadcast ? "Редактировать рассылку" : "Новая рассылка"}</CardTitle>
              <CardDescription>Создайте сообщение для отправки всем пользователям бота</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="title">Название (для админки)</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Например: Акция на боксы"
                    data-testid="input-broadcast-title"
                  />
                </div>
                
                <div>
                  <Label htmlFor="message">Текст сообщения</Label>
                  <Textarea
                    id="message"
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    placeholder="Текст сообщения для пользователей. Можно использовать HTML: <b>жирный</b>, <i>курсив</i>"
                    rows={5}
                    data-testid="input-broadcast-message"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Поддерживается HTML: &lt;b&gt;жирный&lt;/b&gt;, &lt;i&gt;курсив&lt;/i&gt;, &lt;u&gt;подчеркнутый&lt;/u&gt;
                  </p>
                </div>
                
                <div>
                  <Label htmlFor="imageUrl">Изображение (URL, необязательно)</Label>
                  <Input
                    id="imageUrl"
                    value={formData.imageUrl}
                    onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                    placeholder="https://example.com/image.jpg"
                    data-testid="input-broadcast-image"
                  />
                </div>

                <div className="border rounded-lg p-4">
                  <Label className="mb-3 block">Кнопки (необязательно)</Label>
                  
                  {formData.buttons.length > 0 && (
                    <div className="space-y-2 mb-4">
                      {formData.buttons.map((btn, idx) => (
                        <div key={idx} className="flex items-center gap-2 bg-gray-100 p-2 rounded">
                          <span className="flex-1">{btn.label}</span>
                          <Badge variant="outline">{btn.startAppParam}</Badge>
                          <Button 
                            type="button" 
                            variant="ghost" 
                            size="sm"
                            onClick={() => removeButton(idx)}
                          >
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  <div className="grid md:grid-cols-3 gap-2">
                    <Input
                      placeholder="Текст кнопки"
                      value={newButton.label}
                      onChange={(e) => setNewButton({ ...newButton, label: e.target.value })}
                      data-testid="input-button-label"
                    />
                    <div className="flex gap-2">
                      <Input
                        placeholder="Страница (catalog, boxes...)"
                        value={newButton.startAppParam}
                        onChange={(e) => setNewButton({ ...newButton, startAppParam: e.target.value })}
                        data-testid="input-button-param"
                      />
                    </div>
                    <Button type="button" variant="outline" onClick={addButton}>
                      <Plus className="w-4 h-4 mr-1" />
                      Добавить
                    </Button>
                  </div>
                  
                  <div className="flex flex-wrap gap-1 mt-2">
                    {PAGE_PRESETS.map(preset => (
                      <Button
                        key={preset.param}
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="text-xs"
                        onClick={() => setNewButton({ ...newButton, startAppParam: preset.param })}
                      >
                        {preset.label}
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="flex gap-2 pt-4">
                  <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                    {editingBroadcast ? "Сохранить" : "Создать черновик"}
                  </Button>
                  <Button type="button" variant="outline" onClick={resetForm}>
                    Отмена
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Все рассылки</CardTitle>
            <CardDescription>История и черновики рассылок</CardDescription>
          </CardHeader>
          <CardContent>
            {broadcasts && broadcasts.length > 0 ? (
              <div className="space-y-4">
                {broadcasts.map((broadcast) => (
                  <div 
                    key={broadcast.id} 
                    className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                    data-testid={`broadcast-${broadcast.id}`}
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <Megaphone className="w-4 h-4 text-gray-500" />
                          <h3 className="font-semibold">{broadcast.title}</h3>
                          {getStatusBadge(broadcast.status)}
                        </div>
                        <p className="text-sm text-gray-600 line-clamp-2">{broadcast.message}</p>
                      </div>
                      
                      <div className="text-right text-sm text-gray-500">
                        <div>{new Date(broadcast.createdAt).toLocaleString('ru-RU')}</div>
                        {broadcast.status === 'sent' && broadcast.totalRecipients > 0 && (
                          <div className="flex items-center gap-1 justify-end mt-1">
                            <Users className="w-3 h-3" />
                            <span>{broadcast.sentCount}/{broadcast.totalRecipients}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {broadcast.buttons && broadcast.buttons.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-3">
                        {broadcast.buttons.map((btn, idx) => (
                          <Badge key={idx} variant="secondary" className="text-xs">
                            <Link className="w-3 h-3 mr-1" />
                            {btn.label} → {btn.startAppParam}
                          </Badge>
                        ))}
                      </div>
                    )}
                    
                    {broadcast.imageUrl && (
                      <div className="flex items-center gap-1 text-xs text-gray-500 mb-3">
                        <Image className="w-3 h-3" />
                        <span>С изображением</span>
                      </div>
                    )}
                    
                    <div className="flex gap-2">
                      {broadcast.status === 'draft' && (
                        <>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleEdit(broadcast)}
                          >
                            Редактировать
                          </Button>
                          
                          <div className="flex items-center gap-1">
                            <Input
                              placeholder="Telegram ID"
                              className="w-32 h-8 text-xs"
                              value={previewTelegramId}
                              onChange={(e) => setPreviewTelegramId(e.target.value)}
                            />
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                if (previewTelegramId) {
                                  previewMutation.mutate({ id: broadcast.id, telegramId: previewTelegramId });
                                }
                              }}
                              disabled={!previewTelegramId || previewMutation.isPending}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                          </div>
                          
                          <Button
                            size="sm"
                            onClick={() => {
                              if (confirm('Отправить рассылку всем пользователям?')) {
                                sendMutation.mutate(broadcast.id);
                              }
                            }}
                            disabled={sendMutation.isPending}
                          >
                            <Send className="w-4 h-4 mr-1" />
                            Отправить
                          </Button>
                          
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              if (confirm('Удалить рассылку?')) {
                                deleteMutation.mutate(broadcast.id);
                              }
                            }}
                          >
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </Button>
                        </>
                      )}
                      
                      {broadcast.status === 'sending' && (
                        <Badge variant="outline" className="bg-blue-50 text-blue-700">
                          Отправка: {broadcast.sentCount}/{broadcast.totalRecipients}
                        </Badge>
                      )}
                      
                      {broadcast.status === 'sent' && (
                        <div className="text-sm text-gray-500">
                          Отправлено: {broadcast.sentAt && new Date(broadcast.sentAt).toLocaleString('ru-RU')}
                          {broadcast.failedCount > 0 && (
                            <span className="text-red-500 ml-2">
                              (ошибок: {broadcast.failedCount})
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Megaphone className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p className="text-gray-500">Рассылок пока нет</p>
                <p className="text-sm text-gray-400 mt-1">Создайте первую рассылку для пользователей бота</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
