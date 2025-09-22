import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { ArrowLeft, Plus, Minus, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  category: string;
  sizes: string[];
  colors: string[];
  isAvailable: boolean;
}

interface SelectedProduct {
  product: Product;
  quantity: number;
}

export default function CreateBox() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [boxName, setBoxName] = useState("");
  const [boxDescription, setBoxDescription] = useState("");
  const [boxPrice, setBoxPrice] = useState("");
  const [boxCategory, setBoxCategory] = useState("ready");
  const [boxImageUrl, setBoxImageUrl] = useState("");
  const [selectedProducts, setSelectedProducts] = useState<SelectedProduct[]>([]);
  const [showAllProducts, setShowAllProducts] = useState(false);

  // Загружаем список отдельных товаров (не боксов)
  const { data: products, isLoading } = useQuery<Product[]>({
    queryKey: ["/api/admin/products"],
  });

  // Мутация для создания бокса
  const createBoxMutation = useMutation({
    mutationFn: async (boxData: any) => {
      const response = await apiRequest("POST", "/api/boxes", boxData);
      return response.json();
    },
    onSuccess: async (newBox) => {
      // Добавляем выбранные товары в бокс
      for (const selectedProduct of selectedProducts) {
        try {
          await apiRequest("POST", `/api/boxes/${newBox.id}/products`, {
            productId: selectedProduct.product.id,
            quantity: selectedProduct.quantity
          });
        } catch (error) {
          console.error("Error adding product to box:", error);
        }
      }
      
      queryClient.invalidateQueries({ queryKey: ["/api/boxes"] });
      toast({
        title: "Бокс создан",
        description: `Бокс "${boxName}" успешно создан с ${selectedProducts.length} товарами`,
      });
      setLocation("/admin/dashboard");
    },
    onError: () => {
      toast({
        title: "Ошибка",
        description: "Не удалось создать бокс",
        variant: "destructive",
      });
    },
  });

  const addProduct = (product: Product) => {
    const existing = selectedProducts.find(sp => sp.product.id === product.id);
    if (existing) {
      setSelectedProducts(selectedProducts.map(sp => 
        sp.product.id === product.id 
          ? { ...sp, quantity: sp.quantity + 1 }
          : sp
      ));
    } else {
      setSelectedProducts([...selectedProducts, { product, quantity: 1 }]);
    }
  };

  const removeProduct = (productId: string) => {
    setSelectedProducts(selectedProducts.filter(sp => sp.product.id !== productId));
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeProduct(productId);
    } else {
      setSelectedProducts(selectedProducts.map(sp => 
        sp.product.id === productId 
          ? { ...sp, quantity }
          : sp
      ));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!boxName || !boxDescription || !boxPrice || selectedProducts.length === 0) {
      toast({
        title: "Ошибка",
        description: "Заполните все поля и выберите хотя бы один товар",
        variant: "destructive",
      });
      return;
    }

    const boxData = {
      name: boxName,
      description: boxDescription,
      price: parseFloat(boxPrice),
      imageUrl: boxImageUrl || selectedProducts[0]?.product.imageUrl || "",
      category: boxCategory,
      contents: selectedProducts.map(sp => `${sp.product.name} x${sp.quantity}`),
      emoji: "📦",
      isAvailable: true
    };

    createBoxMutation.mutate(boxData);
  };

  const calculateTotalValue = () => {
    return selectedProducts.reduce((sum, sp) => sum + (sp.product.price * sp.quantity), 0);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="p-4 bg-black text-white">
        <div className="flex items-center space-x-3">
          <button onClick={() => setLocation("/admin/dashboard")}>
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div>
            <h2 className="font-semibold">Создать бокс</h2>
            <p className="text-sm text-white/80">Выберите товары и настройте бокс</p>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Форма бокса */}
        <Card>
          <CardHeader>
            <CardTitle>Параметры бокса</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="name">Название бокса</Label>
              <Input
                id="name"
                value={boxName}
                onChange={(e) => setBoxName(e.target.value)}
                placeholder="Например: ФИТНЕС КОМПЛЕКТ"
              />
            </div>
            
            <div>
              <Label htmlFor="description">Описание</Label>
              <Textarea
                id="description"
                value={boxDescription}
                onChange={(e) => setBoxDescription(e.target.value)}
                placeholder="Краткое описание бокса"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="price">Цена (₽)</Label>
                <Input
                  id="price"
                  type="number"
                  value={boxPrice}
                  onChange={(e) => setBoxPrice(e.target.value)}
                  placeholder="0"
                />
              </div>
              
              <div>
                <Label htmlFor="category">Категория</Label>
                <select
                  id="category"
                  value={boxCategory}
                  onChange={(e) => setBoxCategory(e.target.value)}
                  className="w-full p-2 border rounded-md"
                >
                  <option value="ready">Готовые боксы</option>
                  <option value="personal">Персональные</option>
                </select>
              </div>
            </div>
            
            <div>
              <Label htmlFor="imageUrl">URL изображения (необязательно)</Label>
              <Input
                id="imageUrl"
                value={boxImageUrl}
                onChange={(e) => setBoxImageUrl(e.target.value)}
                placeholder="Или будет использовано изображение первого товара"
              />
            </div>
          </CardContent>
        </Card>

        {/* Выбранные товары */}
        {selectedProducts.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Выбранные товары ({selectedProducts.length})</span>
                <Badge variant="outline">
                  Стоимость товаров: {calculateTotalValue()}₽
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {selectedProducts.map((sp) => (
                <div key={sp.product.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                  <img
                    src={sp.product.imageUrl}
                    alt={sp.product.name}
                    className="w-12 h-12 rounded-lg object-cover"
                  />
                  <div className="flex-1">
                    <h4 className="font-medium">{sp.product.name}</h4>
                    <p className="text-sm text-gray-600">{sp.product.price}₽</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => updateQuantity(sp.product.id, sp.quantity - 1)}
                    >
                      <Minus className="w-4 h-4" />
                    </Button>
                    <span className="w-8 text-center">{sp.quantity}</span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => updateQuantity(sp.product.id, sp.quantity + 1)}
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => removeProduct(sp.product.id)}
                  >
                    Удалить
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Каталог товаров */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Выберите товары для бокса</span>
              {products && products.length > 6 && !showAllProducts && (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setShowAllProducts(true)}
                >
                  Показать все товары ({products.length})
                </Button>
              )}
              {showAllProducts && (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setShowAllProducts(false)}
                >
                  Показать меньше
                </Button>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {(showAllProducts ? products : products?.slice(0, 6))?.map((product) => {
                const isSelected = selectedProducts.some(sp => sp.product.id === product.id);
                
                return (
                  <div
                    key={product.id}
                    className={`p-4 border rounded-lg cursor-pointer transition-all ${
                      isSelected ? 'border-green-500 bg-green-50' : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => addProduct(product)}
                  >
                    <div className="flex items-center space-x-3">
                      <img
                        src={product.imageUrl}
                        alt={product.name}
                        className="w-16 h-16 rounded-lg object-cover"
                      />
                      <div className="flex-1">
                        <h4 className="font-medium">{product.name}</h4>
                        <p className="text-sm text-gray-600">{product.description}</p>
                        <p className="font-semibold text-primary">{product.price}₽</p>
                        <div className="flex items-center space-x-2 mt-1">
                          <Badge variant="outline" className="text-xs">
                            {product.category}
                          </Badge>
                          {isSelected && (
                            <div className="flex items-center space-x-1 text-green-600">
                              <Check className="w-4 h-4" />
                              <span className="text-xs">Добавлено</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Кнопка создания */}
        <div className="pb-6">
          <Button
            onClick={handleSubmit}
            disabled={createBoxMutation.isPending || selectedProducts.length === 0}
            className="w-full"
            size="lg"
          >
            {createBoxMutation.isPending ? "Создаем бокс..." : "Создать бокс"}
          </Button>
        </div>
      </div>
    </div>
  );
}