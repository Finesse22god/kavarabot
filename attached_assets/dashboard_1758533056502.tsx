import { useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { LogOut, Package, Users, ShoppingCart, BarChart3, Eye, Edit, Gift, Trash2, CheckSquare, Square } from "lucide-react";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import OrderDetails from "./order-details";
import EditProduct from "./edit-product";
import UserProfile from "./user-profile";
import PromoCodes from "./promo-codes";

interface Order {
  id: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  status: string;
  totalPrice: number;
  deliveryMethod: string;
  deliveryAddress?: string;
  createdAt: string;
  boxId?: string;
  boxName?: string;
  userInfo?: {
    username?: string;
    firstName?: string;
    lastName?: string;
    telegramId?: string;
  };
}

interface User {
  id: string;
  firstName?: string;
  lastName?: string;
  username?: string;
  telegramId: string;
  createdAt: string;
}

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  category: string;
  createdAt: string;
}

interface Box {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  image: string;
  imageUrl?: string;
}

export default function AdminDashboard() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [editingProduct, setEditingProduct] = useState<Box | null | undefined>(undefined);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showPromoCodes, setShowPromoCodes] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [showMassActions, setShowMassActions] = useState(false);

  const handleImportCatalog = async () => {
    setIsImporting(true);
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch('/api/admin/import-catalog', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const result = await response.json();
        toast({
          title: "Каталог обновлен!",
          description: `Успешно импортировано ${result.imported} товаров с сайта kavarabrand.com`
        });
        // Обновляем список товаров
        window.location.reload();
      } else {
        toast({
          title: "Ошибка",
          description: "Не удалось импортировать каталог",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Ошибка импорта:', error);
      toast({
        title: "Ошибка",
        description: "Произошла ошибка при импорте каталога",
        variant: "destructive"
      });
    } finally {
      setIsImporting(false);
    }
  };

  // Check if admin is authenticated
  useEffect(() => {
    const token = localStorage.getItem("adminToken");
    if (!token) {
      setLocation("/admin/login");
    }
  }, [setLocation]);

  const { data: orders, isLoading: ordersLoading } = useQuery<Order[]>({
    queryKey: ["/api/admin/orders"],
    retry: false,
  });

  const { data: users, isLoading: usersLoading } = useQuery<User[]>({
    queryKey: ["/api/admin/users"],
    retry: false,
  });

  const { data: boxes, isLoading: boxesLoading } = useQuery<Box[]>({
    queryKey: ["/api/admin/boxes"],
    retry: false,
  });

  const { data: trainers, isLoading: trainersLoading } = useQuery({
    queryKey: ["/api/admin/trainers"],
    retry: false,
  });

  const { data: products, isLoading: productsLoading } = useQuery<Product[]>({
    queryKey: ["/api/admin/products"],
    retry: false,
  });

  const handleLogout = () => {
    localStorage.removeItem("adminToken");
    toast({
      title: "Выход выполнен",
      description: "Вы вышли из админ панели"
    });
    setLocation("/admin/login");
  };

  const handleDeleteBox = async (boxId: string) => {
    if (!confirm('Вы уверены, что хотите удалить этот бокс?')) {
      return;
    }
    
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`/api/admin/boxes/${boxId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        }
      });

      if (response.ok) {
        toast({
          title: "Бокс удален",
          description: "Бокс успешно удален",
        });
        // Обновить данные
        window.location.reload();
      } else {
        throw new Error('Failed to delete box');
      }
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось удалить бокс",
        variant: "destructive",
      });
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    if (!confirm('Вы уверены, что хотите удалить этот товар?')) {
      return;
    }
    
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`/api/admin/products/${productId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        }
      });

      if (response.ok) {
        toast({
          title: "Товар удален",
          description: "Товар успешно удален",
        });
        // Обновить данные
        window.location.reload();
      } else {
        throw new Error('Failed to delete product');
      }
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось удалить товар",
        variant: "destructive",
      });
    }
  };

  // Массовые операции
  const handleSelectItem = (itemId: string) => {
    setSelectedItems(prev => 
      prev.includes(itemId) 
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };

  const handleSelectAll = () => {
    const allItems = [...(boxes || []), ...(products || [])].map(item => item.id);
    setSelectedItems(selectedItems.length === allItems.length ? [] : allItems);
  };

  const handleMassDelete = async () => {
    if (selectedItems.length === 0) return;
    
    if (!confirm(`Вы уверены, что хотите удалить ${selectedItems.length} товаров?`)) {
      return;
    }

    try {
      const token = localStorage.getItem('adminToken');
      
      for (const itemId of selectedItems) {
        // Проверяем, это бокс или продукт
        const isProduct = products?.some(p => p.id === itemId);
        const endpoint = isProduct ? `/api/admin/products/${itemId}` : `/api/admin/boxes/${itemId}`;
        
        await fetch(endpoint, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
          }
        });
      }

      toast({
        title: "Товары удалены",
        description: `Успешно удалено ${selectedItems.length} товаров`,
      });
      
      setSelectedItems([]);
      setShowMassActions(false);
      window.location.reload();
    } catch (error) {
      console.error('Ошибка массового удаления:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось удалить товары",
        variant: "destructive"
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">Ожидает</Badge>;
      case "paid":
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Оплачен</Badge>;
      case "shipped":
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Отправлен</Badge>;
      case "delivered":
        return <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">Доставлен</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (ordersLoading || usersLoading || boxesLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-black border-t-transparent rounded-full" />
      </div>
    );
  }

  const totalRevenue = orders ? orders.reduce((sum: number, order: Order) => 
    order.status === "paid" ? sum + order.totalPrice : sum, 0) : 0;

  // Если просматриваем детали заказа
  if (selectedOrder) {
    return <OrderDetails order={selectedOrder} onBack={() => setSelectedOrder(null)} />;
  }

  // Если редактируем товар
  if (editingProduct !== undefined) {
    return <EditProduct product={editingProduct} onBack={() => setEditingProduct(undefined)} />;
  }

  // Если просматриваем профиль пользователя
  if (selectedUser) {
    return <UserProfile user={selectedUser} onBack={() => setSelectedUser(null)} />;
  }

  // Если просматриваем промокоды
  if (showPromoCodes) {
    return <PromoCodes onBack={() => setShowPromoCodes(false)} />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center space-x-4">
              <h1 className="text-3xl font-bold text-black">KAVARA Admin Panel</h1>
            </div>
            <Button 
              variant="outline" 
              onClick={handleLogout}
              className="flex items-center space-x-2 px-6 py-3"
            >
              <LogOut className="w-5 h-5" />
              <span>Выйти</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="w-full px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-8 mb-12">
          <Card className="h-40 hover:shadow-lg transition-all duration-300 rounded-2xl border-2">
            <CardContent className="p-8 flex flex-col justify-center h-full">
              <div className="flex items-center justify-between mb-4">
                <span className="text-lg font-semibold text-gray-700">Всего заказов</span>
                <ShoppingCart className="h-8 w-8 text-blue-500" />
              </div>
              <div className="text-4xl font-bold text-gray-900">{orders?.length || 0}</div>
              <div className="text-sm text-gray-500 mt-2">+{orders?.filter(o => new Date(o.createdAt).toDateString() === new Date().toDateString()).length || 0} сегодня</div>
            </CardContent>
          </Card>

          <Card className="h-40 hover:shadow-lg transition-all duration-300 rounded-2xl border-2">
            <CardContent className="p-8 flex flex-col justify-center h-full">
              <div className="flex items-center justify-between mb-4">
                <span className="text-lg font-semibold text-gray-700">Пользователи</span>
                <Users className="h-8 w-8 text-green-500" />
              </div>
              <div className="text-4xl font-bold text-gray-900">{users?.length || 0}</div>
              <div className="text-sm text-gray-500 mt-2">Активных клиентов</div>
            </CardContent>
          </Card>

          <Card className="h-40 hover:shadow-lg transition-all duration-300 rounded-2xl border-2">
            <CardContent className="p-8 flex flex-col justify-center h-full">
              <div className="flex items-center justify-between mb-4">
                <span className="text-lg font-semibold text-gray-700">Товары</span>
                <Package className="h-8 w-8 text-purple-500" />
              </div>
              <div className="text-4xl font-bold text-gray-900">{(boxes?.length || 0) + (products?.length || 0)}</div>
              <div className="text-sm text-gray-500 mt-2">В каталоге</div>
            </CardContent>
          </Card>

          <Card className="h-40 hover:shadow-lg transition-all duration-300 rounded-2xl border-2">
            <CardContent className="p-8 flex flex-col justify-center h-full">
              <div className="flex items-center justify-between mb-4">
                <span className="text-lg font-semibold text-gray-700">Выручка</span>
                <BarChart3 className="h-8 w-8 text-orange-500" />
              </div>
              <div className="text-4xl font-bold text-gray-900">{totalRevenue.toLocaleString()}₽</div>
              <div className="text-sm text-gray-500 mt-2">Общая сумма</div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="orders" className="space-y-8">
          <TabsList className="grid w-full grid-cols-5 h-16 p-2 bg-gray-100 rounded-2xl">
            <TabsTrigger value="orders" className="text-base font-semibold h-12 rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-md">Заказы</TabsTrigger>
            <TabsTrigger value="users" className="text-base font-semibold h-12 rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-md">Пользователи</TabsTrigger>
            <TabsTrigger value="boxes" className="text-base font-semibold h-12 rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-md">Боксы</TabsTrigger>
            <TabsTrigger value="products" className="text-base font-semibold h-12 rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-md">Товары</TabsTrigger>
            <TabsTrigger value="promo-codes" className="text-base font-semibold h-12 rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-md">Промокоды</TabsTrigger>
          </TabsList>

          <TabsContent value="orders">
            <Card className="rounded-2xl shadow-lg border-2">
              <CardHeader className="p-8 pb-6">
                <CardTitle className="text-2xl font-bold">Заказы</CardTitle>
                <CardDescription className="text-lg">Управление заказами пользователей</CardDescription>
              </CardHeader>
              <CardContent className="p-8 pt-0">
                <div className="space-y-6 overflow-x-auto">
                  {orders?.map((order: Order) => (
                    <div key={order.id} className="border-2 border-gray-200 rounded-2xl p-6 hover:bg-gray-50 hover:shadow-md transition-all duration-300">
                      <div className="flex justify-between items-start mb-4">
                        <div className="space-y-2">
                          <h3 className="text-xl font-bold text-gray-900">Заказ #{order.orderNumber}</h3>
                          <p className="text-lg text-gray-700 font-medium">{order.customerName}</p>
                          {order.userInfo?.username && (
                            <p className="text-base text-blue-600 font-semibold">@{order.userInfo.username}</p>
                          )}
                          <p className="text-base text-gray-600">{order.customerEmail}</p>
                          <p className="text-base text-gray-600">{order.customerPhone}</p>
                        </div>
                        <div className="text-right space-y-3">
                          {getStatusBadge(order.status)}
                          <p className="text-2xl font-bold text-gray-900">{order.totalPrice.toLocaleString()}₽</p>
                        </div>
                      </div>
                      <div className="flex justify-between items-end">
                        <div className="text-base text-gray-600 space-y-1">
                          <p><span className="font-medium">Доставка:</span> {order.deliveryMethod}</p>
                          {order.deliveryAddress && <p><span className="font-medium">Адрес:</span> {order.deliveryAddress}</p>}
                          <p><span className="font-medium">Дата:</span> {new Date(order.createdAt).toLocaleDateString('ru-RU')}</p>
                        </div>
                        <Button 
                          size="lg" 
                          variant="outline"
                          onClick={() => setSelectedOrder(order)}
                          className="flex items-center gap-3 px-6 py-3 text-base font-semibold rounded-xl"
                        >
                          <Eye className="h-5 w-5" />
                          Подробнее
                        </Button>
                      </div>
                    </div>
                  ))}
                  {!orders?.length && (
                    <p className="text-center text-gray-500 py-8">Заказов пока нет</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="users">
            <Card className="rounded-2xl shadow-lg border-2">
              <CardHeader className="p-8 pb-6">
                <CardTitle className="text-2xl font-bold">Пользователи</CardTitle>
                <CardDescription className="text-lg">Управление пользователями системы</CardDescription>
              </CardHeader>
              <CardContent className="p-8 pt-0">
                <div className="space-y-6">
                  {users?.map((user: User) => (
                    <div key={user.id} className="border-2 border-gray-200 rounded-2xl p-6 hover:bg-gray-50 hover:shadow-md transition-all duration-300">
                      <div className="flex justify-between items-center">
                        <div className="flex-1 space-y-2">
                          <h3 className="text-xl font-bold text-gray-900">
                            {user.firstName} {user.lastName}
                          </h3>
                          <p className="text-lg text-blue-600 font-semibold">@{user.username}</p>
                          <p className="text-base text-gray-600">Telegram ID: {user.telegramId}</p>
                          <p className="text-base text-gray-500">
                            Регистрация: {new Date(user.createdAt).toLocaleDateString('ru-RU')}
                          </p>
                        </div>
                        <div className="flex items-center gap-4">
                          <Button 
                            size="lg" 
                            variant="outline"
                            onClick={() => setSelectedUser(user)}
                            className="flex items-center gap-3 px-6 py-3 text-base font-semibold rounded-xl"
                          >
                            <Eye className="h-5 w-5" />
                            Профиль
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                  {!users?.length && (
                    <p className="text-center text-gray-500 py-8">Пользователей пока нет</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="boxes">
            <Card className="rounded-2xl shadow-lg border-2">
              <CardHeader className="flex flex-row items-center justify-between p-8 pb-6">
                <div>
                  <CardTitle className="text-2xl font-bold">Готовые боксы</CardTitle>
                  <CardDescription className="text-lg">Управление готовыми боксами KAVARA</CardDescription>
                </div>
                <div className="flex gap-4">
                  <Button 
                    onClick={handleImportCatalog} 
                    variant="outline"
                    disabled={isImporting}
                    className="flex items-center gap-3 px-6 py-3 text-base font-semibold rounded-xl"
                  >
                    {isImporting ? (
                      <div className="w-5 h-5 border-2 border-gray-300 border-t-gray-900 rounded-full animate-spin" />
                    ) : (
                      <Package className="h-5 w-5" />
                    )}
                    {isImporting ? 'Импорт...' : 'Импорт каталога'}
                  </Button>
                  <Button onClick={() => setLocation("/admin/create-box")} className="bg-black hover:bg-gray-800 text-white rounded-xl px-6 py-3 text-base font-semibold">
                    <Package className="h-5 w-5 mr-3" />
                    Создать бокс
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-8 pt-0">
                <div className="space-y-6">
                  {boxes?.filter(box => box.category === 'ready').map((box: Box) => (
                    <div key={box.id} className="border-2 border-gray-200 rounded-2xl p-6 hover:bg-gray-50 hover:shadow-md transition-all duration-300">
                      <div className="flex gap-4">
                        <div className="flex-shrink-0">
                          <img 
                            src={box.imageUrl || box.image} 
                            alt={box.name}
                            className="w-32 h-32 object-cover rounded-2xl"
                          />
                          {(box as any).sportTypes && (box as any).sportTypes.length > 0 && (
                            <div className="mt-2 w-20">
                              <p className="text-xs text-gray-500 mb-1">Виды спорта:</p>
                              <div className="flex flex-wrap gap-1">
                                {(box as any).sportTypes.slice(0, 2).map((sport: string, idx: number) => (
                                  <span key={idx} className="text-xs bg-blue-100 text-blue-800 px-1 py-0.5 rounded text-center block w-full">
                                    {sport}
                                  </span>
                                ))}
                                {(box as any).sportTypes.length > 2 && (
                                  <span className="text-xs text-gray-400">+{(box as any).sportTypes.length - 2}</span>
                                )}
                              </div>
                            </div>
                          )}
                        </div>

                        <div className="flex-1 min-w-0 flex flex-col">
                          <div className="mb-2">
                            <h3 className="text-lg font-semibold mb-1">{box.name}</h3>
                            <p className="text-gray-600 text-sm line-clamp-2 break-words mb-2">{box.description}</p>
                          </div>

                          <div className="flex justify-between items-center mb-3">
                            <div className="text-xl font-bold">{box.price.toLocaleString()}₽</div>
                            <Badge variant="outline">{box.category}</Badge>
                          </div>

                          <div className="flex gap-2 mt-auto">
                            <Button 
                              size="sm" 
                              variant="outline" 
                              onClick={() => setEditingProduct(box)}
                              className="flex items-center justify-center gap-2 flex-1"
                            >
                              <Edit className="h-4 w-4" />
                              Редактировать
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleDeleteBox(box.id)}
                              className="flex items-center justify-center gap-2 flex-1 text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <Package className="h-4 w-4" />
                              Удалить
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  {!boxes?.length && (
                    <p className="text-center text-gray-500 py-8">Товаров пока нет</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="products">
            <Card className="rounded-2xl shadow-lg border-2">
              <CardHeader className="flex flex-row items-center justify-between p-8 pb-6">
                <div>
                  <CardTitle className="text-2xl font-bold">Отдельные товары</CardTitle>
                  <CardDescription className="text-lg">Управление каталогом индивидуальных товаров</CardDescription>
                </div>
                <div className="flex gap-4">
                  <Button 
                    onClick={handleImportCatalog} 
                    variant="outline"
                    disabled={isImporting}
                    className="flex items-center gap-3 px-6 py-3 text-base font-semibold rounded-xl"
                  >
                    {isImporting ? (
                      <div className="w-5 h-5 border-2 border-gray-300 border-t-gray-900 rounded-full animate-spin" />
                    ) : (
                      <Package className="h-5 w-5" />
                    )}
                    {isImporting ? 'Импорт...' : 'Импорт каталога'}
                  </Button>
                  <Button onClick={() => setEditingProduct(null)} className="bg-black hover:bg-gray-800 text-white rounded-xl px-6 py-3 text-base font-semibold">
                    <Package className="h-5 w-5 mr-3" />
                    Добавить товар
                  </Button>
                  <Button 
                    onClick={handleSelectAll}
                    variant="outline"
                    className="flex items-center gap-3 px-6 py-3 text-base font-semibold rounded-xl"
                  >
                    {selectedItems.length > 0 ? <CheckSquare className="h-5 w-5" /> : <Square className="h-5 w-5" />}
                    Выбрать все
                  </Button>
                  {selectedItems.length > 0 && (
                    <Button 
                      onClick={handleMassDelete}
                      variant="destructive"
                      className="flex items-center gap-3 px-6 py-3 text-base font-semibold rounded-xl"
                    >
                      <Trash2 className="h-5 w-5" />
                      Удалить ({selectedItems.length})
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="p-8 pt-0">
                <div className="space-y-6">
                  {/* Отображение отдельных продуктов */}
                  {products?.map((product: Product) => (
                    <div key={product.id} className="border-2 border-gray-200 rounded-2xl p-6 hover:bg-gray-50 hover:shadow-md transition-all duration-300">
                      <div className="flex gap-4">
                        <div className="flex-shrink-0 pt-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleSelectItem(product.id)}
                            className="p-2 h-8 w-8"
                          >
                            {selectedItems.includes(product.id) ? (
                              <CheckSquare className="h-4 w-4 text-blue-600" />
                            ) : (
                              <Square className="h-4 w-4 text-gray-400" />
                            )}
                          </Button>
                        </div>
                        <div className="flex-shrink-0">
                          <img 
                            src={product.imageUrl} 
                            alt={product.name}
                            className="w-32 h-32 object-cover rounded-2xl"
                          />
                        </div>
                        <div className="flex-1">
                          <div className="mb-4">
                            <h3 className="text-2xl font-bold mb-3 text-gray-900">{product.name}</h3>
                            <p className="text-gray-600 text-lg line-clamp-2 break-words mb-4">{product.description}</p>
                          </div>

                          <div className="flex justify-between items-center mb-6">
                            <div className="text-3xl font-bold text-gray-900">{product.price.toLocaleString()}₽</div>
                            <Badge variant="outline" className="text-base px-4 py-2">{product.category}</Badge>
                          </div>

                          <div className="flex gap-4">
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => setEditingProduct(product as any)}
                              className="flex items-center justify-center gap-2 flex-1 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-xl"
                            >
                              <Edit className="h-4 w-4" />
                              Редактировать
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleDeleteProduct(product.id)}
                              className="flex items-center justify-center gap-2 flex-1 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-xl"
                            >
                              <Package className="h-4 w-4" />
                              Удалить
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {/* Отображение боксов с category !== 'ready' */}
                  {boxes?.filter(box => box.category !== 'ready').map((box: Box) => (
                    <div key={box.id} className="border-2 border-gray-200 rounded-2xl p-6 hover:bg-gray-50 hover:shadow-md transition-all duration-300">
                      <div className="flex gap-4">
                        <div className="flex-shrink-0 pt-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleSelectItem(box.id)}
                            className="p-2 h-8 w-8"
                          >
                            {selectedItems.includes(box.id) ? (
                              <CheckSquare className="h-4 w-4 text-blue-600" />
                            ) : (
                              <Square className="h-4 w-4 text-gray-400" />
                            )}
                          </Button>
                        </div>
                        <div className="flex-shrink-0">
                          <img 
                            src={box.imageUrl || box.image} 
                            alt={box.name}
                            className="w-32 h-32 object-cover rounded-2xl"
                          />
                          {(box as any).sportTypes && (box as any).sportTypes.length > 0 && (
                            <div className="mt-2 w-20">
                              <p className="text-xs text-gray-500 mb-1">Виды спорта:</p>
                              <div className="flex flex-wrap gap-1">
                                {(box as any).sportTypes.slice(0, 2).map((sport: string, idx: number) => (
                                  <span key={idx} className="text-xs bg-blue-100 text-blue-800 px-1 py-0.5 rounded text-center block w-full">
                                    {sport}
                                  </span>
                                ))}
                                {(box as any).sportTypes.length > 2 && (
                                  <span className="text-xs text-gray-400">+{(box as any).sportTypes.length - 2}</span>
                                )}
                              </div>
                            </div>
                          )}
                        </div>

                        <div className="flex-1 min-w-0 flex flex-col">
                          <div className="mb-2">
                            <h3 className="text-lg font-semibold mb-1">{box.name}</h3>
                            <p className="text-gray-600 text-sm line-clamp-2 break-words mb-2">{box.description}</p>
                          </div>

                          <div className="flex justify-between items-center mb-3">
                            <div className="text-xl font-bold">{box.price.toLocaleString()}₽</div>
                            <Badge variant="outline">{box.category}</Badge>
                          </div>

                          <div className="flex gap-2 mt-auto">
                            <Button 
                              size="sm" 
                              variant="outline" 
                              onClick={() => setEditingProduct(box)}
                              className="flex items-center justify-center gap-2 flex-1 rounded-xl"
                            >
                              <Edit className="h-4 w-4" />
                              Редактировать
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleDeleteProduct(box.id)}
                              className="flex items-center justify-center gap-2 flex-1 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-xl"
                            >
                              <Package className="h-4 w-4" />
                              Удалить
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  {!products?.length && !boxes?.filter(box => box.category !== 'ready').length && (
                    <p className="text-center text-gray-500 py-8">Товаров пока нет</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="promo-codes">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Управление промокодами</CardTitle>
                    <CardDescription>Создавайте и управляйте промокодами для партнеров</CardDescription>
                  </div>
                  <Button 
                    onClick={() => setShowPromoCodes(true)}
                    className="flex items-center gap-2"
                  >
                    <Gift className="h-4 w-4" />
                    Управление промокодами
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <Gift className="h-12 w-12 mx-auto mb-4 text-primary" />
                  <p className="text-lg font-semibold mb-2">Система промокодов для партнеров</p>
                  <p className="text-muted-foreground mb-4">
                    Создавайте персональные промокоды для тренеров и партнеров, 
                    отслеживайте их использование и аналитику продаж
                  </p>
                  <Button 
                    onClick={() => setShowPromoCodes(true)}
                    className="flex items-center gap-2"
                  >
                    <Gift className="h-4 w-4" />
                    Открыть управление промокодами
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}