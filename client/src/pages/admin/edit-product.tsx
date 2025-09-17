import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { ArrowLeft, Upload, X } from "lucide-react";

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  image: string;
  sportTypes?: string[];
}

interface EditProductProps {
  product: Product | null;
  onBack: () => void;
}

export default function EditProduct({ product, onBack }: EditProductProps) {
  const isCreateMode = !product || !product.id;
  
  const [formData, setFormData] = useState({
    name: product?.name || "",
    description: product?.description || "",
    price: product?.price || 0,
    category: product?.category || "personal",
    image: product?.image || "",
    sportTypes: product?.sportTypes || [],
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState(product?.image || "");
  const [newSportType, setNewSportType] = useState("");

  // Updated sport categories matching quiz
  const availableSportTypes = [
    "Единоборства 🥊",
    "Бег/кардио",
    "Силовые тренировки", 
    "Йога",
    "Командные виды спорта",
    "Повседневная носка"
  ];

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const saveProductMutation = useMutation({
    mutationFn: async (data: any) => {
      const token = localStorage.getItem("adminToken");
      const url = isCreateMode ? "/api/admin/boxes" : `/api/admin/boxes/${product?.id}`;
      const method = isCreateMode ? "POST" : "PUT";
      
      return await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      }).then(res => {
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        }
        return res.json();
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/boxes"] });
      toast({
        title: "Успешно",
        description: isCreateMode ? "Товар создан" : "Товар обновлен",
      });
      onBack();
    },
    onError: (error: any) => {
      toast({
        title: "Ошибка",
        description: error.message || `Не удалось ${isCreateMode ? "создать" : "обновить"} товар`,
        variant: "destructive",
      });
    },
  });

  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;
      const img = new Image();
      
      img.onload = () => {
        // Максимальные размеры
        const maxWidth = 800;
        const maxHeight = 600;
        
        let { width, height } = img;
        
        // Пропорциональное масштабирование
        if (width > height) {
          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = (width * maxHeight) / height;
            height = maxHeight;
          }
        }
        
        canvas.width = width;
        canvas.height = height;
        
        ctx.drawImage(img, 0, 0, width, height);
        
        // Сжимаем до JPEG с качеством 0.8
        const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.8);
        resolve(compressedDataUrl);
      };
      
      img.src = URL.createObjectURL(file);
    });
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Проверяем тип файла
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Ошибка",
          description: "Пожалуйста, выберите изображение",
          variant: "destructive",
        });
        return;
      }
      
      try {
        const compressedImage = await compressImage(file);
        setImagePreview(compressedImage);
        setFormData({ ...formData, image: compressedImage });
      } catch (error) {
        toast({
          title: "Ошибка",
          description: "Не удалось обработать изображение",
          variant: "destructive",
        });
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const submitData = {
      ...formData,
      price: Number(formData.price),
    };

    saveProductMutation.mutate(submitData);
  };

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={onBack}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <CardTitle>{isCreateMode ? "Добавить товар" : "Редактировать товар"}</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Название</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div>
            <Label htmlFor="description">Описание</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
            />
          </div>

          <div>
            <Label htmlFor="price">Цена (₽)</Label>
            <Input
              id="price"
              type="number"
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
              required
            />
          </div>

          <div>
            <Label htmlFor="category">Категория</Label>
            <select
              id="category"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              required
            >
              <option value="">Выберите категорию</option>
              <option value="Топы и футболки">Топы и футболки</option>
              <option value="Низы">Низы</option>
              <option value="Аксессуары">Аксессуары</option>
              <option value="Обувь">Обувь</option>
            </select>
          </div>

          <div>
            <Label>Виды спорта</Label>
            <div className="space-y-3">
              {formData.sportTypes.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {formData.sportTypes.map((sport, index) => (
                    <Badge key={index} variant="secondary" className="flex items-center gap-1">
                      {sport}
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-4 w-4 p-0 hover:bg-transparent"
                        onClick={() => {
                          const updatedSportTypes = formData.sportTypes.filter((_, i) => i !== index);
                          setFormData({ ...formData, sportTypes: updatedSportTypes });
                        }}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </Badge>
                  ))}
                </div>
              )}
              
              <div className="flex gap-2">
                <select
                  value={newSportType}
                  onChange={(e) => setNewSportType(e.target.value)}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="">Выберите вид спорта</option>
                  {availableSportTypes.map((sport) => (
                    <option key={sport} value={sport}>{sport}</option>
                  ))}
                </select>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    if (newSportType && !formData.sportTypes.includes(newSportType)) {
                      setFormData({ 
                        ...formData, 
                        sportTypes: [...formData.sportTypes, newSportType] 
                      });
                      setNewSportType("");
                    }
                  }}
                  disabled={!newSportType || formData.sportTypes.includes(newSportType)}
                >
                  Добавить
                </Button>
              </div>
            </div>
          </div>

          <div>
            <Label htmlFor="image">Изображение</Label>
            <div className="space-y-2">
              {imagePreview && (
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="w-32 h-32 object-cover rounded-lg"
                />
              )}
              <div className="flex items-center gap-2">
                <Input
                  id="image"
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => document.getElementById('image')?.click()}
                  className="flex items-center gap-2"
                >
                  <Upload className="h-4 w-4" />
                  Загрузить фото
                </Button>
                <Input
                  placeholder="Или введите URL изображения"
                  value={formData.image}
                  onChange={(e) => {
                    setFormData({ ...formData, image: e.target.value });
                    setImagePreview(e.target.value);
                  }}
                />
              </div>
            </div>
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="submit" disabled={saveProductMutation.isPending}>
              {saveProductMutation.isPending ? "Сохранение..." : (isCreateMode ? "Создать" : "Сохранить")}
            </Button>
            <Button type="button" variant="outline" onClick={onBack}>
              Отмена
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}