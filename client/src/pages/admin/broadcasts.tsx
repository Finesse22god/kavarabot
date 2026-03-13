import { useState, useRef, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowLeft, Plus, Send, Eye, Trash2, Megaphone, Users,
  CheckCircle, XCircle, Clock, Image, Link, Upload, X, Loader2
} from "lucide-react";
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
  { label: "Каталог (все)", param: "catalog" },
  { label: "Боксы", param: "boxes" },
  { label: "Корзина", param: "cart" },
  { label: "Профиль", param: "profile" },
  { label: "Избранное", param: "favorites" },
  { label: "Квиз", param: "quiz" },
];

const CATALOG_CATEGORIES = [
  "Рашгарды", "Лосины", "Рубашки", "Поло", "Шорты",
  "Футболки", "Майки", "Худи", "Брюки", "Жилеты",
  "Олимпийки", "Джемперы", "Куртки", "Свитшоты",
  "Сумки", "Аксессуары"
];

function TelegramPreview({ message, imageUrl, buttons }: {
  message: string;
  imageUrl?: string;
  buttons: BroadcastButton[];
}) {
  const renderHtml = (text: string) => {
    const escaped = text
      .replace(/&/g, "&amp;")
      .replace(/<b>([\s\S]*?)<\/b>/g, "§BOLD_START§$1§BOLD_END§")
      .replace(/<i>([\s\S]*?)<\/i>/g, "§ITALIC_START§$1§ITALIC_END§")
      .replace(/<u>([\s\S]*?)<\/u>/g, "§UNDER_START§$1§UNDER_END§")
      .replace(/<s>([\s\S]*?)<\/s>/g, "§STRIKE_START§$1§STRIKE_END§")
      .replace(/<code>([\s\S]*?)<\/code>/g, "§CODE_START§$1§CODE_END§")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/§BOLD_START§/g, "<strong>")
      .replace(/§BOLD_END§/g, "</strong>")
      .replace(/§ITALIC_START§/g, "<em>")
      .replace(/§ITALIC_END§/g, "</em>")
      .replace(/§UNDER_START§/g, "<u>")
      .replace(/§UNDER_END§/g, "</u>")
      .replace(/§STRIKE_START§/g, "<s>")
      .replace(/§STRIKE_END§/g, "</s>")
      .replace(/§CODE_START§/g, "<code style='background:#1e2936;padding:1px 4px;border-radius:3px;font-size:0.85em'>")
      .replace(/§CODE_END§/g, "</code>")
      .replace(/\n/g, "<br>");
    return escaped;
  };

  const isEmpty = !message && !imageUrl && buttons.length === 0;

  return (
    <div className="sticky top-4">
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Превью в Telegram</p>

      <div
        className="rounded-2xl p-4 min-h-[200px]"
        style={{ background: "linear-gradient(135deg, #0f2027 0%, #203a43 50%, #2c5364 100%)" }}
      >
        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">K</div>
          <div>
            <p className="text-white text-sm font-semibold leading-tight">KAVARA</p>
            <p className="text-blue-300 text-xs">канал</p>
          </div>
        </div>

        {isEmpty ? (
          <div className="text-center py-8">
            <p className="text-gray-500 text-sm">Начните вводить текст,<br />чтобы увидеть превью</p>
          </div>
        ) : (
          <div className="rounded-xl overflow-hidden" style={{ background: "#1e2936" }}>
            {imageUrl && (
              <img
                src={imageUrl}
                alt="Preview"
                className="w-full object-cover"
                style={{ maxHeight: "300px" }}
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
              />
            )}
            {message && (
              <div
                className="px-3 py-2 text-sm leading-relaxed"
                style={{ color: "#e8eaed" }}
                dangerouslySetInnerHTML={{ __html: renderHtml(message) }}
              />
            )}
            {buttons.length > 0 && (
              <div className="px-2 pb-2 space-y-1">
                {buttons.map((btn, i) => (
                  <button
                    key={i}
                    className="w-full rounded-lg py-1.5 text-sm text-center font-medium"
                    style={{ background: "#2b5278", color: "#6ab3f3" }}
                  >
                    {btn.label}
                  </button>
                ))}
              </div>
            )}
            {message && (
              <div className="px-3 pb-2 flex justify-end">
                <span className="text-xs" style={{ color: "#7d8b99" }}>
                  {new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })} ✓✓
                </span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function ImageUploader({ value, onChange }: {
  value: string;
  onChange: (url: string) => void;
}) {
  const [tab, setTab] = useState<"upload" | "url">("upload");
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const uploadFile = useCallback(async (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast({ title: "Ошибка", description: "Выберите изображение", variant: "destructive" });
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast({ title: "Ошибка", description: "Файл слишком большой (макс. 10 МБ)", variant: "destructive" });
      return;
    }
    setUploading(true);
    try {
      const adminToken = localStorage.getItem("admin_token") || "";
      const formData = new FormData();
      formData.append("image", file);
      const response = await fetch("/api/upload/broadcast-image", {
        method: "POST",
        headers: { "x-admin-token": adminToken },
        body: formData,
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Ошибка загрузки");
      onChange(data.url);
      toast({ title: "Фото загружено" });
    } catch (err: any) {
      toast({ title: "Ошибка загрузки", description: err.message, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  }, [onChange, toast]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) uploadFile(file);
  }, [uploadFile]);

  return (
    <div className="space-y-2">
      <Label>Изображение (необязательно)</Label>

      <Tabs value={tab} onValueChange={(v) => setTab(v as "upload" | "url")}>
        <TabsList className="h-8">
          <TabsTrigger value="upload" className="text-xs gap-1">
            <Upload className="w-3 h-3" /> С компьютера
          </TabsTrigger>
          <TabsTrigger value="url" className="text-xs gap-1">
            <Link className="w-3 h-3" /> По ссылке
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upload" className="mt-2">
          {value && (tab === "upload") ? (
            <div className="relative rounded-xl overflow-hidden border">
              <img src={value} alt="Uploaded" className="w-full max-h-48 object-cover" />
              <button
                type="button"
                onClick={() => onChange("")}
                className="absolute top-2 right-2 bg-black/60 hover:bg-black/80 rounded-full p-1 text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
              <div className="absolute bottom-2 left-2">
                <Badge className="bg-black/60 text-white text-xs">Загружено</Badge>
              </div>
            </div>
          ) : (
            <div
              className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${
                dragging ? "border-blue-400 bg-blue-50" : "border-gray-200 hover:border-gray-400 hover:bg-gray-50"
              }`}
              onClick={() => fileRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={handleDrop}
            >
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) uploadFile(file);
                }}
              />
              {uploading ? (
                <div className="flex flex-col items-center gap-2">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                  <p className="text-sm text-gray-500">Загрузка...</p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
                    <Image className="w-6 h-6 text-gray-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700">Перетащите фото сюда</p>
                    <p className="text-xs text-gray-400 mt-0.5">или нажмите для выбора файла</p>
                  </div>
                  <p className="text-xs text-gray-400">JPG, PNG, WebP, GIF — до 10 МБ</p>
                </div>
              )}
            </div>
          )}
        </TabsContent>

        <TabsContent value="url" className="mt-2">
          <div className="space-y-2">
            <Input
              value={tab === "url" ? value : ""}
              onChange={(e) => onChange(e.target.value)}
              placeholder="https://example.com/image.jpg"
            />
            {tab === "url" && value && (
              <div className="relative rounded-xl overflow-hidden border">
                <img
                  src={value}
                  alt="Preview"
                  className="w-full max-h-48 object-cover"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                />
                <button
                  type="button"
                  onClick={() => onChange("")}
                  className="absolute top-2 right-2 bg-black/60 hover:bg-black/80 rounded-full p-1 text-white transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

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
      toast({ title: "Рассылка создана", description: "Черновик сохранён" });
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
      setFormData({ ...formData, buttons: [...formData.buttons, { ...newButton }] });
      setNewButton({ label: "", startAppParam: "" });
    }
  };

  const removeButton = (index: number) => {
    setFormData({ ...formData, buttons: formData.buttons.filter((_, i) => i !== index) });
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
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button variant="outline" onClick={onBack} className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Назад
            </Button>
            <h1 className="text-2xl font-bold">Рассылки</h1>
          </div>
          {!showForm && (
            <Button onClick={() => setShowForm(true)} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Создать рассылку
            </Button>
          )}
        </div>

        {showForm && (
          <div className="grid lg:grid-cols-[1fr_340px] gap-6 mb-6">
            <Card>
              <CardHeader>
                <CardTitle>{editingBroadcast ? "Редактировать рассылку" : "Новая рассылка"}</CardTitle>
                <CardDescription>Создайте пост — он будет отправлен всем пользователям бота</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div>
                    <Label htmlFor="title">Название (только для вас)</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="Например: Акция на боксы"
                      className="mt-1"
                    />
                  </div>

                  <ImageUploader
                    value={formData.imageUrl}
                    onChange={(url) => setFormData({ ...formData, imageUrl: url })}
                  />

                  <div>
                    <Label htmlFor="message">Текст поста</Label>
                    <Textarea
                      id="message"
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      placeholder="Текст сообщения для пользователей&#10;&#10;Поддерживается форматирование: <b>жирный</b>, <i>курсив</i>, <u>подчёркнутый</u>, <s>зачёркнутый</s>, <code>код</code>"
                      rows={6}
                      className="mt-1 font-mono text-sm"
                    />
                    <div className="flex flex-wrap gap-1 mt-2">
                      {[
                        { label: "<b>ж</b>", insert: "<b></b>", title: "Жирный" },
                        { label: "<i>к</i>", insert: "<i></i>", title: "Курсив" },
                        { label: "<u>п</u>", insert: "<u></u>", title: "Подчёркнутый" },
                        { label: "<s>з</s>", insert: "<s></s>", title: "Зачёркнутый" },
                        { label: "<code/>", insert: "<code></code>", title: "Код" },
                      ].map(({ label, insert, title }) => (
                        <button
                          key={title}
                          type="button"
                          title={title}
                          className="px-2 py-0.5 text-xs border rounded hover:bg-gray-100 font-mono"
                          onClick={() => {
                            const el = document.getElementById("message") as HTMLTextAreaElement;
                            if (!el) return;
                            const start = el.selectionStart;
                            const end = el.selectionEnd;
                            const selected = formData.message.slice(start, end);
                            const tag = insert.split(">")[0].replace("<", "");
                            const newText = formData.message.slice(0, start) + `<${tag}>${selected}</${tag}>` + formData.message.slice(end);
                            setFormData({ ...formData, message: newText });
                          }}
                          dangerouslySetInnerHTML={{ __html: label }}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="border rounded-xl p-4 bg-gray-50/50">
                    <Label className="mb-3 block font-medium">Кнопки (необязательно)</Label>

                    {formData.buttons.length > 0 && (
                      <div className="space-y-2 mb-3">
                        {formData.buttons.map((btn, idx) => (
                          <div key={idx} className="flex items-center gap-2 bg-white border p-2 rounded-lg">
                            <span className="flex-1 text-sm font-medium">{btn.label}</span>
                            <Badge variant="outline" className="text-xs">{btn.startAppParam}</Badge>
                            <Button type="button" variant="ghost" size="sm" onClick={() => removeButton(idx)}>
                              <Trash2 className="w-4 h-4 text-red-500" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="grid grid-cols-[1fr_auto] gap-2 mb-3">
                      <Input
                        placeholder="Текст кнопки (например: Смотреть олимпийки)"
                        value={newButton.label}
                        onChange={(e) => setNewButton({ ...newButton, label: e.target.value })}
                      />
                      <Button type="button" variant="outline" onClick={addButton} disabled={!newButton.label || !newButton.startAppParam}>
                        <Plus className="w-4 h-4 mr-1" />
                        Добавить
                      </Button>
                    </div>

                    <div className="space-y-2">
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Страница для кнопки:</p>
                      <div className="flex flex-wrap gap-1">
                        {PAGE_PRESETS.map(preset => (
                          <button
                            key={preset.param}
                            type="button"
                            className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                              newButton.startAppParam === preset.param
                                ? 'bg-black text-white border-black'
                                : 'bg-white text-gray-700 border-gray-200 hover:border-gray-400'
                            }`}
                            onClick={() => setNewButton({ ...newButton, startAppParam: preset.param })}
                          >
                            {preset.label}
                          </button>
                        ))}
                      </div>

                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide pt-1">Каталог с фильтром:</p>
                      <div className="flex flex-wrap gap-1">
                        {CATALOG_CATEGORIES.map(cat => (
                          <button
                            key={cat}
                            type="button"
                            className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                              newButton.startAppParam === `catalog_${cat}`
                                ? 'bg-blue-600 text-white border-blue-600'
                                : 'bg-white text-gray-700 border-gray-200 hover:border-blue-400'
                            }`}
                            onClick={() => setNewButton({ ...newButton, startAppParam: `catalog_${cat}` })}
                          >
                            {cat}
                          </button>
                        ))}
                      </div>

                      {newButton.startAppParam && (
                        <div className="flex items-center gap-2 mt-1 text-xs text-gray-500 bg-gray-50 rounded-lg px-3 py-2">
                          <span className="font-mono text-gray-400">param:</span>
                          <span className="font-mono font-medium text-gray-700">{newButton.startAppParam}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                      {(createMutation.isPending || updateMutation.isPending) && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                      {editingBroadcast ? "Сохранить" : "Создать черновик"}
                    </Button>
                    <Button type="button" variant="outline" onClick={resetForm}>
                      Отмена
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>

            <TelegramPreview
              message={formData.message}
              imageUrl={formData.imageUrl}
              buttons={formData.buttons}
            />
          </div>
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
                    className="border rounded-xl p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Megaphone className="w-4 h-4 text-gray-500 flex-shrink-0" />
                          <h3 className="font-semibold truncate">{broadcast.title}</h3>
                          {getStatusBadge(broadcast.status)}
                        </div>
                        <p className="text-sm text-gray-600 line-clamp-2">{broadcast.message}</p>
                      </div>

                      <div className="text-right text-sm text-gray-500 ml-4 flex-shrink-0">
                        <div>{new Date(broadcast.createdAt).toLocaleString('ru-RU')}</div>
                        {broadcast.status === 'sent' && broadcast.totalRecipients > 0 && (
                          <div className="flex items-center gap-1 justify-end mt-1">
                            <Users className="w-3 h-3" />
                            <span>{broadcast.sentCount}/{broadcast.totalRecipients}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 mb-3">
                      {broadcast.imageUrl && (
                        <div className="flex items-center gap-1 text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                          <Image className="w-3 h-3" />
                          <span>С фото</span>
                        </div>
                      )}
                      {broadcast.buttons && broadcast.buttons.map((btn, idx) => (
                        <Badge key={idx} variant="secondary" className="text-xs">
                          <Link className="w-3 h-3 mr-1" />
                          {btn.label}
                        </Badge>
                      ))}
                    </div>

                    <div className="flex gap-2 flex-wrap">
                      {broadcast.status === 'draft' && (
                        <>
                          <Button size="sm" variant="outline" onClick={() => handleEdit(broadcast)}>
                            Редактировать
                          </Button>

                          <div className="flex items-center gap-1">
                            <Input
                              placeholder="Telegram ID для теста"
                              className="w-40 h-8 text-xs"
                              value={previewTelegramId}
                              onChange={(e) => setPreviewTelegramId(e.target.value)}
                            />
                            <Button
                              size="sm"
                              variant="outline"
                              title="Отправить тест"
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
                            Отправить всем
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
                            <span className="text-red-500 ml-2">(ошибок: {broadcast.failedCount})</span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Megaphone className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p className="text-gray-500 font-medium">Рассылок пока нет</p>
                <p className="text-sm text-gray-400 mt-1">Создайте первую рассылку для пользователей бота</p>
                <Button className="mt-4" onClick={() => setShowForm(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Создать рассылку
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
