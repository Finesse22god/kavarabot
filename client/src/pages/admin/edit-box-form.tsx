import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { ArrowLeft, Gift, Package, X } from "lucide-react";
import type { Box } from "@shared/schema";
import { matchesCategory, SPORT_TYPES } from "@shared/constants";

interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  imageUrl?: string;
  category?: string;
  brand?: string;
  color?: string;
  isAvailable: boolean;
}

interface EditBoxFormProps {
  box: Box;
  onBack: () => void;
}

export default function EditBoxForm({ box, onBack }: EditBoxFormProps) {
  const [formData, setFormData] = useState({
    name: box.name || "",
    description: box.description || "",
    price: Number(box.price) || 0,
    category: box.category || "personal",
    imageUrl: box.imageUrl || "",
    sportTypes: box.sportTypes || [],
  });
  
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [newSportType, setNewSportType] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Use shared sport types
  const availableSportTypes = [...SPORT_TYPES];

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Load products for selection
  const { data: products, isLoading: productsLoading } = useQuery<Product[]>({
    queryKey: ["/api/admin/products"],
    retry: false,
  });

  // Load current box products
  const { data: currentBoxProducts } = useQuery<Array<{productId: string}>>({
    queryKey: [`/api/boxes/${box.id}/products`],
    retry: false,
  });

  // Set initial selected products when data loads
  useEffect(() => {
    if (currentBoxProducts && Array.isArray(currentBoxProducts)) {
      const productIds = currentBoxProducts.map(bp => bp.productId);
      setSelectedProducts(productIds);
    }
  }, [currentBoxProducts]);

  const updateBoxMutation = useMutation({
    mutationFn: async (data: any) => {
      const token = localStorage.getItem("adminToken");
      return await fetch(`/api/admin/boxes/${box.id}`, {
        method: "PUT",
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
      toast({
        title: "Успех!",
        description: "Бокс успешно обновлен",
      });
      // Invalidate cache to refresh data
      queryClient.invalidateQueries({ queryKey: ["/api/admin/boxes"] });
      onBack();
    },
    onError: (error: any) => {
      console.error("Ошибка обновления бокса:", error);
      toast({
        title: "Ошибка",
        description: "Не удалось обновить бокс",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const token = localStorage.getItem("adminToken");
    if (!token) {
      toast({
        title: "Ошибка авторизации",
        description: "Необходимо войти в систему",
        variant: "destructive",
      });
      return;
    }
    
    if (!formData.name || !formData.price) {
      toast({
        title: "Ошибка",
        description: "Название и цена обязательны",
        variant: "destructive",
      });
      return;
    }

    if (selectedProducts.length === 0) {
      toast({
        title: "Ошибка", 
        description: "Выберите хотя бы один товар для бокса",
        variant: "destructive",
      });
      return;
    }

    if (selectedProducts.length > 4) {
      toast({
        title: "Ошибка",
        description: "Максимум 4 товара в боксе",
        variant: "destructive",
      });
      return;
    }

    const boxData = {
      ...formData,
      productIds: selectedProducts,
      productQuantities: selectedProducts.map(() => 1), // По умолчанию количество 1
      isAvailable: true,
    };

    updateBoxMutation.mutate(boxData);
  };

  const handleProductToggle = (productId: string) => {
    setSelectedProducts(prev => {
      if (prev.includes(productId)) {
        return prev.filter(id => id !== productId);
      } else if (prev.length < 4) {
        return [...prev, productId];
      } else {
        toast({
          title: "Лимит товаров",
          description: "Максимум 4 товара в боксе",
          variant: "destructive",
        });
        return prev;
      }
    });
  };

  const addSportType = () => {
    if (newSportType && !formData.sportTypes.includes(newSportType)) {
      setFormData(prev => ({
        ...prev,
        sportTypes: [...prev.sportTypes, newSportType]
      }));
      setNewSportType("");
    }
  };

  const removeSportType = (sportType: string) => {
    setFormData(prev => ({
      ...prev,
      sportTypes: prev.sportTypes.filter(type => type !== sportType)
    }));
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center mb-6">
          <Button
            variant="outline"
            size="sm"
            onClick={onBack}
            className="mr-4"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Назад
          </Button>
          <h1 className="text-2xl font-bold text-gray-900">Редактировать бокс</h1>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Основная информация о боксе */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Gift className="h-5 w-5 mr-2" />
                Информация о боксе
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="name">Название бокса *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Введите название бокса"
                    required
                    data-testid="input-box-name"
                  />
                </div>

                <div>
                  <Label htmlFor="description">Описание</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Описание бокса"
                    rows={3}
                    data-testid="textarea-box-description"
                  />
                </div>

                <div>
                  <Label htmlFor="price">Цена (₽) *</Label>
                  <Input
                    id="price"
                    type="number"
                    value={formData.price}
                    onChange={(e) => setFormData(prev => ({ ...prev, price: Number(e.target.value) }))}
                    placeholder="0"
                    required
                    data-testid="input-box-price"
                  />
                </div>

                <div>
                  <Label htmlFor="imageUrl">URL изображения</Label>
                  <Input
                    id="imageUrl"
                    value={formData.imageUrl}
                    onChange={(e) => setFormData(prev => ({ ...prev, imageUrl: e.target.value }))}
                    placeholder="https://example.com/image.jpg"
                    data-testid="input-box-image"
                  />
                </div>

                <div>
                  <Label htmlFor="category">Категория</Label>
                  <select
                    id="category"
                    value={formData.category}
                    onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full p-2 border border-gray-300 rounded-md"
                    data-testid="select-box-category"
                  >
                    <option value="personal">Персональный</option>
                    <option value="group">Групповой</option>
                    <option value="premium">Премиум</option>
                  </select>
                </div>

                {/* Виды спорта */}
                <div>
                  <Label>Виды спорта</Label>
                  <div className="flex gap-2 mb-2">
                    <Input
                      value={newSportType}
                      onChange={(e) => setNewSportType(e.target.value)}
                      placeholder="Добавить вид спорта"
                      className="flex-1"
                      data-testid="input-sport-type"
                    />
                    <Button type="button" onClick={addSportType} size="sm">
                      Добавить
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {availableSportTypes.map((sport) => (
                      <Button
                        key={sport}
                        type="button"
                        variant={formData.sportTypes.includes(sport) ? "default" : "outline"}
                        size="sm"
                        onClick={() => {
                          if (formData.sportTypes.includes(sport)) {
                            removeSportType(sport);
                          } else {
                            setFormData(prev => ({
                              ...prev,
                              sportTypes: [...prev.sportTypes, sport]
                            }));
                          }
                        }}
                        data-testid={`button-sport-${sport}`}
                      >
                        {sport}
                      </Button>
                    ))}
                  </div>
                  {formData.sportTypes.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {formData.sportTypes.map((sportType) => (
                        <Badge key={sportType} variant="secondary">
                          {sportType}
                          <X
                            className="h-3 w-3 ml-1 cursor-pointer"
                            onClick={() => removeSportType(sportType)}
                          />
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>

                <Button
                  type="submit"
                  disabled={updateBoxMutation.isPending}
                  className="w-full"
                  data-testid="button-update-box"
                >
                  {updateBoxMutation.isPending ? "Обновление..." : "Обновить бокс"}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Выбор товаров */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Package className="h-5 w-5 mr-2" />
                Выбор товаров ({selectedProducts.length}/4)
              </CardTitle>
            </CardHeader>
            <CardContent>
              {/* Фильтры и поиск */}
              <div className="space-y-3 mb-4">
                <div>
                  <Label className="text-xs">Поиск товара</Label>
                  <Input
                    placeholder="Название товара..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="mt-1"
                    data-testid="input-product-search"
                  />
                </div>
                <div>
                  <Label className="text-xs">Фильтр по категории</Label>
                  <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md mt-1"
                    data-testid="select-category-filter"
                  >
                    <option value="all">Все категории</option>
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
              </div>

              {/* Hidden selected products indicator */}
              {selectedProducts.length > 0 && products && (() => {
                const visibleSelected = products.filter(p => 
                  selectedProducts.includes(p.id) && 
                  matchesCategory(p.category, categoryFilter) &&
                  (searchQuery === "" || p.name.toLowerCase().includes(searchQuery.toLowerCase()))
                ).length;
                const hiddenCount = selectedProducts.length - visibleSelected;
                
                return hiddenCount > 0 ? (
                  <div className="mt-2 p-2 bg-amber-50 border border-amber-200 rounded-md text-sm text-amber-800">
                    ⚠️ {hiddenCount} выбранных товар(ов) скрыто текущими фильтрами
                  </div>
                ) : null;
              })()}

              {productsLoading ? (
                <div className="text-center py-4">Загрузка товаров...</div>
              ) : products && products.length > 0 ? (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {/* Выбранные товары (сверху) */}
                  {products
                    .filter(product => 
                      product.isAvailable && 
                      selectedProducts.includes(product.id) &&
                      matchesCategory(product.category, categoryFilter) &&
                      (searchQuery === "" || product.name.toLowerCase().includes(searchQuery.toLowerCase()))
                    )
                    .map((product) => (
                    <div
                      key={product.id}
                      className="p-3 border-2 border-green-300 bg-green-50 rounded-lg cursor-pointer transition-colors"
                      onClick={() => handleProductToggle(product.id)}
                      data-testid={`product-item-${product.id}`}
                    >
                      <div className="flex items-center space-x-3">
                        <Checkbox
                          checked={true}
                          onChange={() => handleProductToggle(product.id)}
                          data-testid={`checkbox-product-${product.id}`}
                        />
                        {product.imageUrl && (
                          <img
                            src={product.imageUrl}
                            alt={product.name}
                            className="w-12 h-12 object-cover rounded"
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-sm">{product.name}</h4>
                          {product.description && (
                            <p className="text-xs text-gray-500 truncate">
                              {product.description}
                            </p>
                          )}
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-sm font-semibold">{product.price}₽</span>
                            {product.brand && (
                              <Badge variant="outline" className="text-xs">
                                {product.brand}
                              </Badge>
                            )}
                            {product.category && (
                              <Badge variant="secondary" className="text-xs">
                                {product.category}
                              </Badge>
                            )}
                            <Badge variant="default" className="text-xs bg-green-600">
                              ✓ В боксе
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {/* Остальные товары */}
                  {products
                    .filter(product => 
                      product.isAvailable && 
                      !selectedProducts.includes(product.id) &&
                      matchesCategory(product.category, categoryFilter) &&
                      (searchQuery === "" || product.name.toLowerCase().includes(searchQuery.toLowerCase()))
                    )
                    .map((product) => (
                    <div
                      key={product.id}
                      className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                        selectedProducts.includes(product.id)
                          ? "bg-blue-50 border-blue-200"
                          : "hover:bg-gray-50"
                      }`}
                      onClick={() => handleProductToggle(product.id)}
                      data-testid={`product-item-${product.id}`}
                    >
                      <div className="flex items-center space-x-3">
                        <Checkbox
                          checked={selectedProducts.includes(product.id)}
                          onChange={() => handleProductToggle(product.id)}
                          data-testid={`checkbox-product-${product.id}`}
                        />
                        {product.imageUrl && (
                          <img
                            src={product.imageUrl}
                            alt={product.name}
                            className="w-12 h-12 object-cover rounded"
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-sm">{product.name}</h4>
                          {product.description && (
                            <p className="text-xs text-gray-500 truncate">
                              {product.description}
                            </p>
                          )}
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-sm font-semibold">{product.price}₽</span>
                            {product.brand && (
                              <Badge variant="outline" className="text-xs">
                                {product.brand}
                              </Badge>
                            )}
                            {product.category && (
                              <Badge variant="secondary" className="text-xs">
                                {product.category}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Package className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                  <p>Товары не найдены</p>
                  <p className="text-sm">Сначала создайте товары в каталоге</p>
                </div>
              )}
              
              {selectedProducts.length > 0 && (
                <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm font-medium text-green-800">
                    Выбрано товаров: {selectedProducts.length} из 4
                  </p>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {selectedProducts.map((productId) => {
                      const product = products?.find(p => p.id === productId);
                      return product ? (
                        <Badge key={productId} variant="secondary" className="text-xs">
                          {product.name}
                        </Badge>
                      ) : null;
                    })}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}