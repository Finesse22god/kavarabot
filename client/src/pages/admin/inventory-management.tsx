import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Package, Box as BoxIcon, Edit, Save, X, AlertCircle } from "lucide-react";
import type { Product, Box } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface InventoryItem {
  id: string;
  name: string;
  type: 'product' | 'box';
  sizes: string[] | null | undefined;
  inventory: Record<string, number> | null | undefined;
  category?: string | null;
  imageUrl?: string | null;
}

export default function InventoryManagement({ onBack }: { onBack: () => void }) {
  const { toast } = useToast();
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [editInventory, setEditInventory] = useState<Record<string, number>>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<"all" | "product" | "box">("all");

  const { data: products, isLoading: productsLoading } = useQuery<Product[]>({
    queryKey: ["/api/admin/products"],
  });

  const { data: boxes, isLoading: boxesLoading } = useQuery<Box[]>({
    queryKey: ["/api/admin/boxes"],
  });

  const updateProductMutation = useMutation({
    mutationFn: async ({ id, inventory }: { id: string; inventory: Record<string, number> }) => {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`/api/admin/products/${id}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ inventory }),
      });
      if (!response.ok) throw new Error('Failed to update product inventory');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/products"] });
      toast({
        title: "Остатки обновлены",
        description: "Остатки товара успешно обновлены",
      });
      setEditingItem(null);
    },
    onError: () => {
      toast({
        title: "Ошибка",
        description: "Не удалось обновить остатки",
        variant: "destructive",
      });
    },
  });

  const updateBoxMutation = useMutation({
    mutationFn: async ({ id, inventory }: { id: string; inventory: Record<string, number> }) => {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`/api/admin/boxes/${id}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ inventory }),
      });
      if (!response.ok) throw new Error('Failed to update box inventory');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/boxes"] });
      toast({
        title: "Остатки обновлены",
        description: "Остатки бокса успешно обновлены",
      });
      setEditingItem(null);
    },
    onError: () => {
      toast({
        title: "Ошибка",
        description: "Не удалось обновить остатки",
        variant: "destructive",
      });
    },
  });

  const allItems: InventoryItem[] = [
    ...(products || []).map(p => ({
      id: p.id,
      name: p.name,
      type: 'product' as const,
      sizes: p.sizes,
      inventory: p.inventory,
      category: p.category,
      imageUrl: p.imageUrl,
    })),
    ...(boxes || []).map(b => ({
      id: b.id,
      name: b.name,
      type: 'box' as const,
      sizes: b.availableSizes,
      inventory: b.inventory,
      category: b.category,
      imageUrl: b.imageUrl,
    }))
  ];

  const filteredItems = allItems.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === "all" || item.type === filterType;
    return matchesSearch && matchesType;
  });

  const handleEdit = (item: InventoryItem) => {
    setEditingItem(item.id);
    setEditInventory(item.inventory || {});
  };

  const handleSave = (item: InventoryItem) => {
    if (item.type === 'product') {
      updateProductMutation.mutate({ id: item.id, inventory: editInventory });
    } else {
      updateBoxMutation.mutate({ id: item.id, inventory: editInventory });
    }
  };

  const handleCancel = () => {
    setEditingItem(null);
    setEditInventory({});
  };

  const updateInventoryValue = (size: string, value: string) => {
    const numValue = parseInt(value) || 0;
    setEditInventory(prev => ({
      ...prev,
      [size]: numValue >= 0 ? numValue : 0,
    }));
  };

  const getTotalStock = (inventory: Record<string, number> | null): number => {
    if (!inventory) return 0;
    return Object.values(inventory).reduce((sum, qty) => sum + qty, 0);
  };

  const hasLowStock = (inventory: Record<string, number> | null): boolean => {
    if (!inventory) return false;
    return Object.values(inventory).some(qty => qty < 5 && qty > 0);
  };

  const hasOutOfStock = (inventory: Record<string, number> | null): boolean => {
    if (!inventory) return true;
    return Object.values(inventory).some(qty => qty === 0);
  };

  const isLoading = productsLoading || boxesLoading;

  return (
    <div className="w-full min-h-screen bg-gray-50 p-6">
      <div className="mb-6">
        <Button onClick={onBack} variant="outline" className="mb-4">
          ← Назад к панели управления
        </Button>
        
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Управление остатками</CardTitle>
            <CardDescription>
              Отслеживание и управление остатками товаров и боксов по размерам
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <Input
                placeholder="Поиск по названию..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                data-testid="input-inventory-search"
              />
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value as "all" | "product" | "box")}
                className="w-full p-2 border border-gray-300 rounded-md"
                data-testid="select-inventory-type"
              >
                <option value="all">Все типы</option>
                <option value="product">Только товары</option>
                <option value="box">Только боксы</option>
              </select>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="flex items-center gap-1">
                  <Package className="h-3 w-3" />
                  Товары: {products?.length || 0}
                </Badge>
                <Badge variant="outline" className="flex items-center gap-1">
                  <BoxIcon className="h-3 w-3" />
                  Боксы: {boxes?.length || 0}
                </Badge>
              </div>
            </div>

            {isLoading ? (
              <div className="flex justify-center py-8">
                <div className="text-gray-500">Загрузка данных...</div>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredItems.length > 0 ? (
                  filteredItems.map((item) => {
                    const isEditing = editingItem === item.id;
                    const currentInventory = isEditing ? editInventory : (item.inventory || {});
                    const totalStock = getTotalStock(item.inventory);
                    const lowStock = hasLowStock(item.inventory);
                    const outOfStock = hasOutOfStock(item.inventory);

                    return (
                      <Card key={item.id} className="overflow-hidden">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex items-start gap-4 flex-1">
                              {item.imageUrl && (
                                <div className="w-20 h-20 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                                  <img
                                    src={item.imageUrl}
                                    alt={item.name}
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                              )}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-2">
                                  <h3 className="font-semibold text-lg truncate">{item.name}</h3>
                                  <Badge variant={item.type === 'product' ? 'default' : 'secondary'}>
                                    {item.type === 'product' ? 'Товар' : 'Бокс'}
                                  </Badge>
                                  {item.category && (
                                    <Badge variant="outline">{item.category}</Badge>
                                  )}
                                </div>

                                <div className="mb-3">
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="text-sm font-medium text-gray-700">
                                      Всего на складе: {totalStock} шт.
                                    </span>
                                    {outOfStock && (
                                      <Badge variant="destructive" className="flex items-center gap-1">
                                        <AlertCircle className="h-3 w-3" />
                                        Есть нулевые остатки
                                      </Badge>
                                    )}
                                    {lowStock && !outOfStock && (
                                      <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                                        Низкие остатки
                                      </Badge>
                                    )}
                                  </div>
                                </div>

                                {item.sizes && item.sizes.length > 0 ? (
                                  <div className="space-y-2">
                                    <p className="text-sm font-medium text-gray-700">Остатки по размерам:</p>
                                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
                                      {item.sizes.map((size) => {
                                        const qty = currentInventory[size] || 0;
                                        return (
                                          <div key={size} className="flex flex-col">
                                            <label className="text-xs text-gray-600 mb-1">
                                              Размер {size}
                                            </label>
                                            {isEditing ? (
                                              <Input
                                                type="number"
                                                min="0"
                                                value={qty}
                                                onChange={(e) => updateInventoryValue(size, e.target.value)}
                                                className="h-8 text-sm"
                                                data-testid={`input-inventory-${item.id}-${size}`}
                                              />
                                            ) : (
                                              <div className={`px-3 py-1 border rounded-md text-sm font-medium ${
                                                qty === 0 
                                                  ? 'bg-red-50 text-red-700 border-red-200' 
                                                  : qty < 5 
                                                  ? 'bg-yellow-50 text-yellow-700 border-yellow-200'
                                                  : 'bg-green-50 text-green-700 border-green-200'
                                              }`}>
                                                {qty} шт.
                                              </div>
                                            )}
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </div>
                                ) : (
                                  <p className="text-sm text-gray-500">Размеры не указаны</p>
                                )}
                              </div>
                            </div>

                            <div className="flex gap-2 flex-shrink-0">
                              {isEditing ? (
                                <>
                                  <Button
                                    size="sm"
                                    onClick={() => handleSave(item)}
                                    disabled={updateProductMutation.isPending || updateBoxMutation.isPending}
                                    data-testid={`button-save-inventory-${item.id}`}
                                  >
                                    <Save className="h-4 w-4 mr-1" />
                                    Сохранить
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={handleCancel}
                                    data-testid={`button-cancel-inventory-${item.id}`}
                                  >
                                    <X className="h-4 w-4 mr-1" />
                                    Отмена
                                  </Button>
                                </>
                              ) : (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleEdit(item)}
                                  data-testid={`button-edit-inventory-${item.id}`}
                                >
                                  <Edit className="h-4 w-4 mr-1" />
                                  Редактировать
                                </Button>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    Ничего не найдено
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
