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
import { ArrowLeft, Upload, X, RefreshCw } from "lucide-react";

interface Product {
  id: string;
  name: string;
  externalId?: string;
  description: string;
  price: number;
  category: string;
  brand?: string;
  color?: string;
  sizes?: string[];
  imageUrl?: string;
  images?: string[];
}

interface EditProductProps {
  product: Product | null;
  onBack: () => void;
}

export default function EditProduct({ product, onBack }: EditProductProps) {
  const isCreateMode = !product || !product.id;
  
  const [formData, setFormData] = useState({
    name: product?.name || "",
    externalId: product?.externalId || "",
    description: product?.description || "",
    price: product?.price || 0,
    category: product?.category || "",
    brand: product?.brand || "",
    color: product?.color || "",
    sizes: product?.sizes || [],
    imageUrl: product?.imageUrl || "",
    images: product?.images || [],
  });
  const [imagePreviews, setImagePreviews] = useState<string[]>(
    product?.images || (product?.imageUrl ? [product.imageUrl] : [])
  );

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const saveProductMutation = useMutation({
    mutationFn: async (data: any) => {
      const token = localStorage.getItem("adminToken");
      const url = isCreateMode ? "/api/admin/products" : `/api/admin/products/${product?.id}`;
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
      queryClient.invalidateQueries({ queryKey: ["/api/admin/products"] });
      toast({
        title: "Успешно",
        description: isCreateMode ? "Товар создан" : "Товар обновлен",
      });
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
    const files = Array.from(e.target.files || []);
    
    if (files.length + imagePreviews.length > 3) {
      toast({
        title: "Ошибка",
        description: "Можно добавить максимум 3 изображения",
        variant: "destructive",
      });
      return;
    }
    
    for (const file of files) {
      // Проверяем тип файла
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Ошибка",
          description: "Пожалуйста, выберите изображения",
          variant: "destructive",
        });
        return;
      }
      
      try {
        const compressedImage = await compressImage(file);
        setImagePreviews(prev => [...prev, compressedImage]);
        setFormData(prev => ({
          ...prev,
          images: [...prev.images, compressedImage],
          imageUrl: prev.images.length === 0 ? compressedImage : prev.imageUrl // Первое изображение как основное
        }));
      } catch (error) {
        toast({
          title: "Ошибка",
          description: "Не удалось обработать изображение",
          variant: "destructive",
        });
      }
    }
  };

  const removeImage = (index: number) => {
    const newPreviews = imagePreviews.filter((_, i) => i !== index);
    const newImages = formData.images.filter((_, i) => i !== index);
    
    setImagePreviews(newPreviews);
    setFormData({
      ...formData,
      images: newImages,
      imageUrl: newImages.length > 0 ? newImages[0] : "" // Первое изображение как основное
    });
  };

  const setMainImage = (index: number) => {
    setFormData({
      ...formData,
      imageUrl: formData.images[index]
    });
  };

  const generateExternalId = () => {
    // Генерируем externalId в формате: KAVARA-{timestamp}-{random}
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    const externalId = `KAVARA-${timestamp}-${random}`;
    
    setFormData({
      ...formData,
      externalId: externalId
    });

    toast({
      title: "ID сгенерирован",
      description: `Внешний ID: ${externalId}`,
    });
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
            <Label htmlFor="externalId">Внешний ID (для 1С)</Label>
            <div className="flex gap-2">
              <Input
                id="externalId"
                data-testid="input-external-id"
                value={formData.externalId}
                onChange={(e) => setFormData({ ...formData, externalId: e.target.value })}
                placeholder="Уникальный ID товара в 1С"
              />
              <Button
                type="button"
                variant="outline"
                data-testid="button-generate-external-id"
                onClick={generateExternalId}
                className="flex items-center gap-2 whitespace-nowrap"
              >
                <RefreshCw className="h-4 w-4" />
                Сгенерировать
              </Button>
            </div>
            <p className="text-sm text-gray-500 mt-1">
              Используется для синхронизации с 1С. Должен быть уникальным.
            </p>
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
              <option value="Рашгарды">Рашгарды</option>
              <option value="Лосины">Лосины</option>
              <option value="Рубашки">Рубашки</option>
              <option value="Поло">Поло</option>
              <option value="Шорты">Шорты</option>
              <option value="Футболки">Футболки</option>
              <option value="Майки">Майки</option>
              <option value="Худи">Худи</option>
              <option value="Брюки">Брюки</option>
              <option value="Жилеты">Жилеты</option>
              <option value="Олимпийки">Олимпийки</option>
              <option value="Джемперы">Джемперы</option>
              <option value="Куртки">Куртки</option>
              <option value="Свитшоты">Свитшоты</option>
              <option value="Сумки">Сумки</option>
              <option value="Аксессуары">Аксессуары</option>
            </select>
          </div>

          <div>
            <Label htmlFor="brand">Бренд</Label>
            <Input
              id="brand"
              value={formData.brand || ""}
              onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
              placeholder="Название бренда"
            />
          </div>

          <div>
            <Label htmlFor="color">Цвет</Label>
            <Input
              id="color"
              value={formData.color || ""}
              onChange={(e) => setFormData({ ...formData, color: e.target.value })}
              placeholder="Цвет товара"
            />
          </div>

          <div>
            <Label htmlFor="sizes">Доступные размеры</Label>
            <div className="space-y-3">
              <div className="flex flex-wrap gap-2">
                {["XS", "S", "M", "L", "XL", "XXL", "3XL"].map((size) => (
                  <Button
                    key={size}
                    type="button"
                    variant={formData.sizes?.includes(size) ? "default" : "outline"}
                    size="sm"
                    onClick={() => {
                      const currentSizes = formData.sizes || [];
                      if (currentSizes.includes(size)) {
                        setFormData({
                          ...formData,
                          sizes: currentSizes.filter(s => s !== size)
                        });
                      } else {
                        setFormData({
                          ...formData,
                          sizes: [...currentSizes, size]
                        });
                      }
                    }}
                  >
                    {size}
                  </Button>
                ))}
              </div>
              <p className="text-sm text-gray-500">
                Выберите доступные размеры для товара. Если товар не имеет размеров (например, аксессуары), оставьте поле пустым.
              </p>
            </div>
          </div>


          <div>
            <Label htmlFor="images">Изображения товара (до 3 фото)</Label>
            <div className="space-y-4">
              {/* Preview uploaded images */}
              {imagePreviews.length > 0 && (
                <div className="grid grid-cols-3 gap-4">
                  {imagePreviews.map((preview, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={preview}
                        alt={`Preview ${index + 1}`}
                        className="w-full h-32 object-cover rounded-lg"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        className="absolute top-1 right-1 h-6 w-6 p-0"
                        onClick={() => removeImage(index)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                      {formData.imageUrl === formData.images[index] ? (
                        <Badge className="absolute bottom-1 left-1 text-xs bg-green-600">
                          Основное
                        </Badge>
                      ) : (
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          className="absolute bottom-1 left-1 text-xs h-6 px-2 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => setMainImage(index)}
                        >
                          Сделать основным
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              )}
              
              {/* Upload buttons */}
              {imagePreviews.length < 3 && (
                <div className="flex flex-col gap-2">
                  <Input
                    id="images"
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageChange}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => document.getElementById('images')?.click()}
                    className="flex items-center gap-2"
                  >
                    <Upload className="h-4 w-4" />
                    Загрузить фото ({imagePreviews.length}/3)
                  </Button>
                  <p className="text-sm text-gray-500">
                    Первое изображение будет основным для отображения
                  </p>
                </div>
              )}
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