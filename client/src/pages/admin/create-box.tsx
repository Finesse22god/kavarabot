import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Checkbox } from "@/components/ui/checkbox";

export default function AdminCreateBox() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  // Check if admin is authenticated
  useEffect(() => {
    const token = localStorage.getItem("adminToken");
    console.log("🔑 Проверка авторизации:", token ? "ТОКЕН НАЙДЕН" : "ТОКЕН НЕ НАЙДЕН");
    if (!token) {
      setLocation("/admin/login");
    }
  }, [setLocation]);
  const [boxData, setBoxData] = useState({
    name: "",
    description: "",
    price: "",
    originalPrice: "",
    imageUrl: "",
    contents: "",
    availableSizes: "",
    sportTypes: [] as string[],
    selectedProducts: [] as string[],
    isQuizOnly: false
  });

  // Fetch all products for selection
  const { data: products = [] } = useQuery({
    queryKey: ["/api/products"],
    queryFn: async () => {
      const response = await fetch("/api/products");
      if (!response.ok) throw new Error("Failed to fetch products");
      return response.json();
    },
  });

  const createBoxMutation = useMutation({
    mutationFn: async (boxCreateData: any) => {
      console.log("🚀 Начинаем создание бокса...");
      console.log("📦 Данные для создания:", boxCreateData);
      
      const token = localStorage.getItem("adminToken");
      console.log("🔑 Токен для авторизации:", token ? "НАЙДЕН" : "НЕ НАЙДЕН");
      
      if (!token) {
        console.error("❌ Токен не найден в localStorage!");
        throw new Error("Admin token not found");
      }

      console.log("📡 Отправляем запрос на /api/admin/boxes...");
      
      try {
        const response = await fetch("/api/admin/boxes", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
          },
          body: JSON.stringify(boxCreateData),
        });

        console.log("📡 Получен ответ:", response.status, response.statusText);
        
        if (!response.ok) {
          console.error("❌ Запрос неуспешен:", response.status);
          const error = await response.json();
          console.error("❌ Детали ошибки:", error);
          throw new Error(error.error || "Failed to create box");
        }

        const result = await response.json();
        console.log("✅ Бокс успешно создан:", result);
        return result;
      } catch (fetchError) {
        console.error("❌ Ошибка при выполнении fetch:", fetchError);
        throw fetchError;
      }
    },
    onSuccess: () => {
      toast({
        title: "Успех!",
        description: "Бокс успешно создан",
      });
      setLocation("/admin/dashboard");
    },
    onError: (error: Error) => {
      toast({
        title: "Ошибка",
        description: error.message || "Не удалось создать бокс",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Отладочная информация
    const token = localStorage.getItem("adminToken");
    console.log("🔍 Отладка создания бокса:");
    console.log("Токен из localStorage:", token ? "ЕСТЬ" : "НЕТ");
    console.log("Данные формы:", boxData);
    
    if (!boxData.name || !boxData.price) {
      toast({
        title: "Ошибка",
        description: "Заполните обязательные поля: название и цену",
        variant: "destructive",
      });
      return;
    }

    const createData = {
      name: boxData.name,
      description: boxData.description,
      price: parseFloat(boxData.price),
      imageUrl: boxData.imageUrl,
      sportTypes: boxData.sportTypes,
      productIds: boxData.selectedProducts,
      productQuantities: boxData.selectedProducts.map(() => 1), // 1 for each product
      isAvailable: true,
      isQuizOnly: boxData.isQuizOnly,
    };

    console.log("Отправляемые данные:", createData);
    createBoxMutation.mutate(createData);
  };

  const handleInputChange = (field: string, value: string) => {
    setBoxData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Создать новый бокс</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <Label htmlFor="name">Название бокса</Label>
                <Input
                  id="name"
                  value={boxData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  required
                />
              </div>

              <div>
                <Label htmlFor="description">Описание</Label>
                <Textarea
                  id="description"
                  value={boxData.description}
                  onChange={(e) => handleInputChange("description", e.target.value)}
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="price">Цена (₽)</Label>
                  <Input
                    id="price"
                    type="number"
                    value={boxData.price}
                    onChange={(e) => handleInputChange("price", e.target.value)}
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="originalPrice">Старая цена (₽)</Label>
                  <Input
                    id="originalPrice"
                    type="number"
                    value={boxData.originalPrice}
                    onChange={(e) => handleInputChange("originalPrice", e.target.value)}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="imageUrl">URL изображения</Label>
                <Input
                  id="imageUrl"
                  type="url"
                  value={boxData.imageUrl}
                  onChange={(e) => handleInputChange("imageUrl", e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="contents">Содержимое (через запятую)</Label>
                <Input
                  id="contents"
                  value={boxData.contents}
                  onChange={(e) => handleInputChange("contents", e.target.value)}
                  placeholder="Футболка, шорты, кроссовки"
                />
              </div>

              <div>
                <Label htmlFor="availableSizes">Доступные размеры (через запятую)</Label>
                <Input
                  id="availableSizes"
                  value={boxData.availableSizes}
                  onChange={(e) => handleInputChange("availableSizes", e.target.value)}
                  placeholder="S, M, L, XL"
                />
              </div>

              {/* Product Selection */}
              <div>
                <Label>Выберите товары для бокса (максимум 6)</Label>
                <div className="grid grid-cols-1 gap-2 mt-2 max-h-60 overflow-y-auto border rounded-lg p-4">
                  {products.map((product: any) => (
                    <div key={product.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={product.id}
                        checked={boxData.selectedProducts.includes(product.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            if (boxData.selectedProducts.length < 6) {
                              setBoxData(prev => ({
                                ...prev,
                                selectedProducts: [...prev.selectedProducts, product.id]
                              }));
                            } else {
                              toast({
                                title: "Предупреждение",
                                description: "Максимум 6 товаров в боксе",
                                variant: "destructive"
                              });
                            }
                          } else {
                            setBoxData(prev => ({
                              ...prev,
                              selectedProducts: prev.selectedProducts.filter(id => id !== product.id)
                            }));
                          }
                        }}
                        disabled={!boxData.selectedProducts.includes(product.id) && boxData.selectedProducts.length >= 6}
                      />
                      <Label htmlFor={product.id} className="text-sm">
                        {product.name} - {product.price}₽ ({product.category})
                      </Label>
                    </div>
                  ))}
                </div>
                <p className="text-sm text-gray-500 mt-2">
                  Выбрано: {boxData.selectedProducts.length} из 6
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="isQuizOnly"
                  checked={boxData.isQuizOnly}
                  onCheckedChange={(checked) => {
                    setBoxData(prev => ({ ...prev, isQuizOnly: checked === true }));
                  }}
                  data-testid="checkbox-quiz-only"
                />
                <Label htmlFor="isQuizOnly" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  Эксклюзивный бокс только для квиза (не показывать в каталоге)
                </Label>
              </div>

              <Button 
                type="submit" 
                className="w-full" 
                disabled={createBoxMutation.isPending}
                data-testid="button-create-box"
              >
                {createBoxMutation.isPending ? "Создание..." : "Создать бокс"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}