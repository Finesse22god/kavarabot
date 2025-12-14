import { useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { LogOut, Package, Users, ShoppingCart, BarChart3, Eye, Edit, Gift, Trash2, CheckSquare, Square, Clock, Settings, Megaphone, Bell } from "lucide-react";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import OrderDetails from "./order-details";
import EditProduct from "./edit-product";
import UserProfile from "./user-profile";
import PromoCodes from "./promo-codes";
import CreateBoxForm from "./create-box-form";
import EditBoxForm from "./edit-box-form";
import QuizSettings from "./quiz-settings";
import Analytics from "./analytics";
import InventoryManagement from "./inventory-management";
import Broadcasts from "./broadcasts";
import { NotificationsTab } from "./notifications-tab";
import type { Box, Product } from "@shared/schema";

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
  productId?: string;
  cartItems?: string;
  selectedSize?: string;
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


interface BoxProductsStats {
  totalProductsInBoxes: number;
}

// Helper function to get brief order content description
function getOrderContentBrief(order: Order): string {
  if (order.boxName) {
    return `Готовый бокс: ${order.boxName}`;
  }
  if (order.boxId) {
    return `Бокс (ID: ${order.boxId})`;
  }
  if (order.productId) {
    return `Товар (ID: ${order.productId})`;
  }
  if (order.cartItems) {
    try {
      const items = JSON.parse(order.cartItems);
      if (items && items.length > 0) {
        return `Корзина (${items.length} товаров)`;
      }
    } catch (e) {
      // Ignore JSON parse errors
    }
  }
  return 'Состав не указан';
}

// Helper function to calculate total inventory
function getTotalInventory(inventory: Record<string, number> | null | undefined): number {
  if (!inventory) return 0;
  return Object.values(inventory).reduce((sum, qty) => sum + qty, 0);
}

// Helper function to check if inventory is low
function hasLowInventory(inventory: Record<string, number> | null | undefined): boolean {
  if (!inventory) return false;
  const total = getTotalInventory(inventory);
  return total > 0 && total < 10;
}

// Helper function to check if out of stock
function isOutOfStock(inventory: Record<string, number> | null | undefined): boolean {
  const total = getTotalInventory(inventory);
  return total === 0;
}

export default function AdminDashboard() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [editingProduct, setEditingProduct] = useState<Product | null | undefined>(undefined);
  const [editingBox, setEditingBox] = useState<Box | null | undefined | 'create_box'>(undefined);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showPromoCodes, setShowPromoCodes] = useState(false);
  const [showQuizSettings, setShowQuizSettings] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [showInventory, setShowInventory] = useState(false);
  const [showBroadcasts, setShowBroadcasts] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [selectedBoxes, setSelectedBoxes] = useState<string[]>([]);
  const [showMassActions, setShowMassActions] = useState(false);
  const [categoryFilterProducts, setCategoryFilterProducts] = useState<string>("all");
  const [searchQueryProducts, setSearchQueryProducts] = useState("");

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

  const { data: boxProductsStats, isLoading: statsLoading } = useQuery<BoxProductsStats>({
    queryKey: ["/api/admin/box-products/stats"],
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
          description: "Товар успешно удален из системы"
        });
        window.location.reload();
      } else {
        toast({
          title: "Ошибка",
          description: "Не удалось удалить товар",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Ошибка удаления:', error);
      toast({
        title: "Ошибка",
        description: "Произошла ошибка при удалении товара",
        variant: "destructive"
      });
    }
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
          description: "Бокс успешно удален из системы"
        });
        window.location.reload();
      } else {
        toast({
          title: "Ошибка",
          description: "Не удалось удалить бокс",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Ошибка удаления:', error);
      toast({
        title: "Ошибка",
        description: "Произошла ошибка при удалении бокса",
        variant: "destructive"
      });
    }
  };

  const handleBulkDeleteProducts = async () => {
    if (selectedProducts.length === 0) {
      toast({
        title: "Не выбраны товары",
        description: "Выберите товары для удаления",
        variant: "destructive"
      });
      return;
    }

    if (!confirm(`Вы уверены, что хотите удалить ${selectedProducts.length} товаров?`)) {
      return;
    }

    try {
      const token = localStorage.getItem('adminToken');
      
      // Удаляем все выбранные товары
      const deletePromises = selectedProducts.map(productId =>
        fetch(`/api/admin/products/${productId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
          }
        })
      );

      const results = await Promise.all(deletePromises);
      const failedDeletes = results.filter(result => !result.ok);

      if (failedDeletes.length === 0) {
        toast({
          title: "Товары удалены",
          description: `${selectedProducts.length} товаров успешно удалено`
        });
        setSelectedProducts([]); // Очищаем выбор
        window.location.reload();
      } else {
        toast({
          title: "Частичная ошибка",
          description: `Удалено ${results.length - failedDeletes.length} из ${results.length} товаров`,
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Ошибка массового удаления:', error);
      toast({
        title: "Ошибка",
        description: "Произошла ошибка при удалении товаров",
        variant: "destructive"
      });
    }
  };

  const handleBulkDeleteBoxes = async () => {
    if (selectedBoxes.length === 0) {
      toast({
        title: "Не выбраны боксы",
        description: "Выберите боксы для удаления",
        variant: "destructive"
      });
      return;
    }

    if (!confirm(`Вы уверены, что хотите удалить ${selectedBoxes.length} боксов?`)) {
      return;
    }

    try {
      const token = localStorage.getItem('adminToken');
      
      // Удаляем все выбранные боксы
      const deletePromises = selectedBoxes.map(boxId =>
        fetch(`/api/admin/boxes/${boxId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
          }
        })
      );

      const results = await Promise.all(deletePromises);
      const failedDeletes = results.filter(result => !result.ok);

      if (failedDeletes.length === 0) {
        toast({
          title: "Боксы удалены",
          description: `${selectedBoxes.length} боксов успешно удалено`
        });
        setSelectedBoxes([]); // Очищаем выбор
        window.location.reload();
      } else {
        toast({
          title: "Частичная ошибка",
          description: `Удалено ${results.length - failedDeletes.length} из ${results.length} боксов`,
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Ошибка массового удаления:', error);
      toast({
        title: "Ошибка",
        description: "Произошла ошибка при удалении боксов",
        variant: "destructive"
      });
    }
  };

  const handleSelectProduct = (productId: string) => {
    setSelectedProducts(prev => 
      prev.includes(productId) 
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };

  const handleSelectBox = (boxId: string) => {
    setSelectedBoxes(prev => 
      prev.includes(boxId) 
        ? prev.filter(id => id !== boxId)
        : [...prev, boxId]
    );
  };

  const handleSelectAllProducts = (products: any[]) => {
    const allIds = products.map(item => item.id);
    setSelectedProducts(prev => 
      prev.length === allIds.length ? [] : allIds
    );
  };

  const handleSelectAllBoxes = (boxes: any[]) => {
    const allIds = boxes.map(item => item.id);
    setSelectedBoxes(prev => 
      prev.length === allIds.length ? [] : allIds
    );
  };

  // Show order details modal
  if (selectedOrder) {
    return <OrderDetails order={selectedOrder} onBack={() => setSelectedOrder(null)} />;
  }

  // Show box creation form
  if (editingBox === 'create_box') {
    return <CreateBoxForm onBack={() => setEditingBox(undefined)} />;
  }

  // Show box edit modal
  if (editingBox !== undefined && editingBox !== 'create_box') {
    return <EditBoxForm box={editingBox as Box} onBack={() => setEditingBox(undefined)} />;
  }

  // Show product edit modal
  if (editingProduct !== undefined) {
    return <EditProduct product={editingProduct} onBack={() => setEditingProduct(undefined)} />;
  }

  // Show user profile modal
  if (selectedUser) {
    return <UserProfile user={selectedUser} onBack={() => setSelectedUser(null)} />;
  }

  // Show promo codes modal
  if (showPromoCodes) {
    return <PromoCodes onBack={() => setShowPromoCodes(false)} />;
  }

  // Show quiz settings modal
  if (showQuizSettings) {
    return <QuizSettings onBack={() => setShowQuizSettings(false)} />;
  }

  // Show analytics modal
  if (showAnalytics) {
    return <Analytics onBack={() => setShowAnalytics(false)} />;
  }

  // Show inventory management
  if (showInventory) {
    return <InventoryManagement onBack={() => setShowInventory(false)} />;
  }

  // Show broadcasts management
  if (showNotifications) {
    return <NotificationsTab adminToken={localStorage.getItem('adminToken') || ''} onBack={() => setShowNotifications(false)} />;
  }

  if (showBroadcasts) {
    return <Broadcasts onBack={() => setShowBroadcasts(false)} />;
  }

  const stats = {
    totalOrders: orders?.length || 0,
    totalUsers: users?.length || 0,
    totalRevenue: orders?.reduce((sum, order) => sum + order.totalPrice, 0) || 0,
    activeBoxes: boxes?.length || 0,
    totalProducts: products?.length || 0,
    totalProductsInBoxes: boxProductsStats?.totalProductsInBoxes || 0,
    // Новая расширенная аналитика
    todaysOrders: orders?.filter(o => new Date(o.createdAt).toDateString() === new Date().toDateString()).length || 0,
    todaysRevenue: orders?.filter(o => o.status === 'paid' && new Date(o.createdAt).toDateString() === new Date().toDateString())
      .reduce((sum, o) => sum + o.totalPrice, 0) || 0,
    paidOrders: orders?.filter(o => o.status === 'paid').length || 0,
    pendingOrders: orders?.filter(o => o.status === 'pending').length || 0,
    averageOrderValue: orders?.length > 0 ? (orders?.reduce((sum, order) => sum + order.totalPrice, 0) / orders?.length) : 0
  };

  return (
    <div className="w-full min-h-screen bg-gray-50">
      <div className="w-full">
        {/* Header */}
        <div className="bg-white border-b p-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">KAVARA Admin</h1>
              <p className="text-gray-600 mt-1">Панель управления</p>
            </div>
            <Button 
              onClick={handleLogout}
              variant="outline"
              className="flex items-center gap-2"
            >
              <LogOut className="h-4 w-4" />
              Выйти
            </Button>
          </div>
        </div>

        <div className="p-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Заказы</CardTitle>
                <ShoppingCart className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalOrders}</div>
                <p className="text-xs text-muted-foreground">
                  +{stats.todaysOrders} сегодня
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Пользователи</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalUsers}</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Выручка</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalRevenue.toLocaleString('ru-RU')}₽</div>
                <p className="text-xs text-muted-foreground">
                  +{stats.todaysRevenue.toLocaleString('ru-RU')}₽ сегодня
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Активные боксы</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.activeBoxes}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Всего товаров</CardTitle>
                <Gift className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalProducts}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Товары в боксах</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalProductsInBoxes}</div>
                <p className="text-xs text-muted-foreground">
                  Общее количество товаров во всех боксах
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Additional Analytics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Оплаченные заказы</CardTitle>
                <ShoppingCart className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{stats.paidOrders}</div>
                <p className="text-xs text-muted-foreground">
                  {stats.totalOrders > 0 ? Math.round((stats.paidOrders / stats.totalOrders) * 100) : 0}% от всех заказов
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">В ожидании</CardTitle>
                <Clock className="h-4 w-4 text-orange-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">{stats.pendingOrders}</div>
                <p className="text-xs text-muted-foreground">
                  Ожидают оплаты
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Средний чек</CardTitle>
                <BarChart3 className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">
                  {Math.round(stats.averageOrderValue).toLocaleString('ru-RU')}₽
                </div>
                <p className="text-xs text-muted-foreground">
                  На один заказ
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <Tabs defaultValue="orders" className="space-y-6">
            <TabsList className="grid w-full grid-cols-6">
              <TabsTrigger value="orders">Заказы</TabsTrigger>
              <TabsTrigger value="users">Пользователи</TabsTrigger>
              <TabsTrigger value="products">Товары</TabsTrigger>
              <TabsTrigger value="boxes">Боксы</TabsTrigger>
              <TabsTrigger value="inventory">Остатки</TabsTrigger>
              <TabsTrigger value="management">Управление</TabsTrigger>
            </TabsList>

            {/* Orders Tab */}
            <TabsContent value="orders">
              <Card>
                <CardHeader>
                  <CardTitle>Заказы</CardTitle>
                  <CardDescription>
                    Управление заказами клиентов
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {ordersLoading ? (
                    <div className="flex justify-center py-8">
                      <div className="text-gray-500">Загрузка заказов...</div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {orders && orders.length > 0 ? (
                        orders.map((order) => (
                          <div
                            key={order.id}
                            className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                          >
                            <div className="flex-1">
                              <div className="flex items-center gap-3">
                                <div>
                                  <p className="font-medium">#{order.orderNumber}</p>
                                  <p className="text-sm text-gray-600">
                                    {order.customerName || order.userInfo?.firstName + ' ' + order.userInfo?.lastName || 'Неизвестно'}
                                  </p>
                                  <p className="text-xs text-gray-500">
                                    {getOrderContentBrief(order)}
                                  </p>
                                </div>
                                <Badge variant={order.status === 'paid' ? 'default' : 'secondary'}>
                                  {order.status === 'paid' ? 'Оплачен' : 
                                   order.status === 'pending' ? 'Ожидает оплаты' : order.status}
                                </Badge>
                              </div>
                              <p className="text-sm text-gray-500 mt-1">
                                {new Date(order.createdAt).toLocaleDateString('ru-RU')}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="font-medium">{order.totalPrice.toLocaleString('ru-RU')}₽</p>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setSelectedOrder(order)}
                                className="mt-2"
                              >
                                <Eye className="h-4 w-4 mr-1" />
                                Детали
                              </Button>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-8 text-gray-500">
                          Заказов пока нет
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Users Tab */}
            <TabsContent value="users">
              <Card>
                <CardHeader>
                  <CardTitle>Пользователи</CardTitle>
                  <CardDescription>
                    Управление пользователями системы
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {usersLoading ? (
                    <div className="flex justify-center py-8">
                      <div className="text-gray-500">Загрузка пользователей...</div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {users && users.length > 0 ? (
                        users.map((user) => (
                          <div
                            key={user.id}
                            className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                          >
                            <div className="flex-1">
                              <div className="flex items-center gap-3">
                                <div>
                                  <p className="font-medium">
                                    {user.firstName && user.lastName ? 
                                      `${user.firstName} ${user.lastName}` : 
                                      user.username || 'Неизвестно'
                                    }
                                  </p>
                                  <p className="text-sm text-gray-600">
                                    @{user.username || 'без_username'}
                                  </p>
                                </div>
                              </div>
                              <p className="text-sm text-gray-500 mt-1">
                                Telegram ID: {user.telegramId}
                              </p>
                              <p className="text-sm text-gray-500">
                                Регистрация: {new Date(user.createdAt).toLocaleDateString('ru-RU')}
                              </p>
                            </div>
                            <div>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setSelectedUser(user)}
                              >
                                <Eye className="h-4 w-4 mr-1" />
                                Профиль
                              </Button>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-8 text-gray-500">
                          Пользователей пока нет
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Products Tab */}
            <TabsContent value="products">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Товары каталога</CardTitle>
                      <CardDescription>
                        Управление товарами в каталоге
                      </CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={handleImportCatalog}
                        disabled={isImporting}
                        variant="outline"
                      >
                        {isImporting ? "Импорт..." : "Импорт с сайта"}
                      </Button>
                      <Button onClick={() => setEditingProduct(null)}>
                        <Package className="h-4 w-4 mr-1" />
                        Создать товар
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {productsLoading ? (
                    <div className="flex justify-center py-8">
                      <div className="text-gray-500">Загрузка товаров...</div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {products && products.length > 0 ? (
                        <div>
                          {/* Фильтры и поиск */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                            <Input
                              placeholder="Поиск по названию..."
                              value={searchQueryProducts}
                              onChange={(e) => setSearchQueryProducts(e.target.value)}
                              data-testid="input-products-search"
                            />
                            <select
                              value={categoryFilterProducts}
                              onChange={(e) => setCategoryFilterProducts(e.target.value)}
                              className="w-full p-2 border border-gray-300 rounded-md"
                              data-testid="select-products-category"
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

                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleSelectAllProducts(products.filter(p => 
                                  (categoryFilterProducts === "all" || p.category === categoryFilterProducts) &&
                                  (searchQueryProducts === "" || p.name.toLowerCase().includes(searchQueryProducts.toLowerCase()))
                                ))}
                              >
                                {selectedProducts.length === products.filter(p => 
                                  (categoryFilterProducts === "all" || p.category === categoryFilterProducts) &&
                                  (searchQueryProducts === "" || p.name.toLowerCase().includes(searchQueryProducts.toLowerCase()))
                                ).length ? <CheckSquare className="h-4 w-4" /> : <Square className="h-4 w-4" />}
                                Выбрать все
                              </Button>
                              {selectedProducts.length > 0 && (
                                <Badge variant="secondary">
                                  Выбрано: {selectedProducts.length}
                                </Badge>
                              )}
                            </div>
                            {selectedProducts.length > 0 && (
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => handleBulkDeleteProducts()}
                              >
                                <Trash2 className="h-4 w-4 mr-1" />
                                Удалить выбранные
                              </Button>
                            )}
                          </div>
                          
                          {products
                            .filter(product => 
                              (categoryFilterProducts === "all" || product.category === categoryFilterProducts) &&
                              (searchQueryProducts === "" || product.name.toLowerCase().includes(searchQueryProducts.toLowerCase()))
                            )
                            .map((product) => (
                            <div
                              key={product.id}
                              className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                            >
                              <div className="flex items-center gap-3">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleSelectProduct(product.id)}
                                >
                                  {selectedProducts.includes(product.id) ? 
                                    <CheckSquare className="h-4 w-4" /> : 
                                    <Square className="h-4 w-4" />
                                  }
                                </Button>
                                <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden">
                                  <img
                                    src={product.imageUrl}
                                    alt={product.name}
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                                <div className="flex-1">
                                  <p className="font-medium">{product.name}</p>
                                  <p className="text-sm text-gray-600 line-clamp-2">
                                    {product.description}
                                  </p>
                                  <div className="flex items-center gap-2 mt-1">
                                    <Badge variant="outline">{product.category}</Badge>
                                    {product.inventory && (
                                      <>
                                        {isOutOfStock(product.inventory) ? (
                                          <Badge variant="destructive" className="text-xs">
                                            Нет в наличии
                                          </Badge>
                                        ) : hasLowInventory(product.inventory) ? (
                                          <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 text-xs">
                                            Остаток: {getTotalInventory(product.inventory)} шт.
                                          </Badge>
                                        ) : (
                                          <Badge variant="secondary" className="bg-green-100 text-green-800 text-xs">
                                            В наличии: {getTotalInventory(product.inventory)} шт.
                                          </Badge>
                                        )}
                                      </>
                                    )}
                                  </div>
                                </div>
                              </div>
                              <div className="text-right flex items-center gap-2">
                                <div>
                                  <p className="font-medium">{(typeof product.price === 'string' ? parseFloat(product.price) : product.price).toLocaleString('ru-RU')}₽</p>
                                </div>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => setEditingProduct(product)}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => handleDeleteProduct(product.id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8 text-gray-500">
                          Товаров пока нет
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Boxes Tab */}
            <TabsContent value="boxes">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Готовые боксы</CardTitle>
                      <CardDescription>
                        Управление готовыми боксами для клиентов
                      </CardDescription>
                    </div>
                    <div className="flex gap-2">
                      {selectedBoxes.length > 0 && (
                        <Button
                          variant="destructive"
                          onClick={() => handleBulkDeleteBoxes()}
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          Удалить выбранные ({selectedBoxes.length})
                        </Button>
                      )}
                      <Button onClick={() => setEditingBox('create_box')}>
                        <Package className="h-4 w-4 mr-1" />
                        Создать бокс
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {boxesLoading ? (
                    <div className="text-center py-8">Загрузка боксов...</div>
                  ) : (
                    <div className="space-y-4">
                      {boxes && boxes.length > 0 ? (
                        <div>
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleSelectAllBoxes(boxes)}
                              >
                                {selectedBoxes.length === boxes.length ? <CheckSquare className="h-4 w-4" /> : <Square className="h-4 w-4" />}
                                Выбрать все
                              </Button>
                              {selectedBoxes.length > 0 && (
                                <Badge variant="secondary">
                                  Выбрано: {selectedBoxes.length}
                                </Badge>
                              )}
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {boxes.map((box: Box) => (
                              <div key={box.id} className="border rounded-lg p-4 relative">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleSelectBox(box.id)}
                                  className="absolute top-2 left-2 z-10"
                                >
                                  {selectedBoxes.includes(box.id) ? 
                                    <CheckSquare className="h-4 w-4" /> : 
                                    <Square className="h-4 w-4" />
                                  }
                                </Button>
                                {box.imageUrl && (
                                  <img 
                                    src={box.imageUrl} 
                                    alt={box.name}
                                    className="w-full h-48 object-cover rounded mb-3"
                                  />
                                )}
                                <h3 className="font-semibold text-lg mb-2">{box.name}</h3>
                                <p className="text-gray-600 text-sm mb-2">{box.description || ''}</p>
                                <p className="text-lg font-bold mb-2">{box.price}₽</p>
                                {box.inventory && (
                                  <div className="mb-2">
                                    {isOutOfStock(box.inventory) ? (
                                      <Badge variant="destructive" className="text-xs">
                                        Нет в наличии
                                      </Badge>
                                    ) : hasLowInventory(box.inventory) ? (
                                      <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 text-xs">
                                        Остаток: {getTotalInventory(box.inventory)} шт.
                                      </Badge>
                                    ) : (
                                      <Badge variant="secondary" className="bg-green-100 text-green-800 text-xs">
                                        В наличии: {getTotalInventory(box.inventory)} шт.
                                      </Badge>
                                    )}
                                  </div>
                                )}
                                <div className="flex gap-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setEditingBox(box)}
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleDeleteBox(box.id)}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-8 text-gray-500">
                          Боксов пока нет
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Inventory Tab */}
            <TabsContent value="inventory">
              <Card>
                <CardHeader>
                  <CardTitle>Управление остатками</CardTitle>
                  <CardDescription>
                    Отслеживание остатков товаров и боксов по размерам. Подготовка к интеграции с 1С.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8">
                    <Package className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                    <h3 className="text-lg font-semibold mb-2">Система управления остатками</h3>
                    <p className="text-gray-600 mb-6">
                      Управляйте остатками товаров и боксов по размерам. <br />
                      В будущем здесь будет интеграция с 1С для автоматического обновления остатков и оплат.
                    </p>
                    <Button 
                      onClick={() => setShowInventory(true)}
                      size="lg"
                      data-testid="button-manage-inventory"
                    >
                      <Package className="h-5 w-5 mr-2" />
                      Открыть управление остатками
                    </Button>
                  </div>
                  
                  <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium">Всего товаров</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{stats.totalProducts}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                          В каталоге
                        </p>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium">Всего боксов</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{stats.activeBoxes}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                          Активных боксов
                        </p>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium">Товары в боксах</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{stats.totalProductsInBoxes}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                          Всего единиц
                        </p>
                      </CardContent>
                    </Card>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Management Tab */}
            <TabsContent value="management">
              <div className="grid gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Управление системой</CardTitle>
                    <CardDescription>
                      Дополнительные инструменты администратора
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <Button
                        variant="outline"
                        className="h-20 flex flex-col gap-2"
                        onClick={() => setShowAnalytics(true)}
                        data-testid="button-analytics"
                      >
                        <BarChart3 className="h-6 w-6" />
                        Аналитика заказов
                      </Button>

                      <Button
                        variant="outline"
                        className="h-20 flex flex-col gap-2"
                        onClick={() => setShowPromoCodes(true)}
                        data-testid="button-promo-codes"
                      >
                        <Gift className="h-6 w-6" />
                        Промокоды
                      </Button>
                      
                      <Button
                        variant="outline"
                        className="h-20 flex flex-col gap-2"
                        onClick={() => setShowQuizSettings(true)}
                        data-testid="button-quiz-settings"
                      >
                        <Settings className="h-6 w-6" />
                        Настройки квиза
                      </Button>
                      
                      <Button
                        variant="outline"
                        className="h-20 flex flex-col gap-2"
                        onClick={() => setShowBroadcasts(true)}
                        data-testid="button-broadcasts"
                      >
                        <Megaphone className="h-6 w-6" />
                        Рассылки
                      </Button>
                      
                      <Button
                        variant="outline"
                        className="h-20 flex flex-col gap-2"
                        onClick={() => setShowNotifications(true)}
                        data-testid="button-notifications"
                      >
                        <Bell className="h-6 w-6" />
                        Уведомления
                      </Button>
                      
                      <Button
                        variant="outline"
                        className="h-20 flex flex-col gap-2"
                        onClick={() => window.location.reload()}
                        data-testid="button-reload-data"
                      >
                        <ShoppingCart className="h-6 w-6" />
                        Обновить данные
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Additional management tools can be added here */}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}