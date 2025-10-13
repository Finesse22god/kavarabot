import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Calendar, TrendingUp, DollarSign, ShoppingCart } from "lucide-react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface Order {
  id: string;
  orderNumber: string;
  status: string;
  totalPrice: number;
  createdAt: string;
  deliveryMethod: string;
  boxId?: string;
  productId?: string;
  cartItems?: string;
}

interface AnalyticsProps {
  onBack: () => void;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export default function Analytics({ onBack }: AnalyticsProps) {
  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    date.setMonth(date.getMonth() - 1);
    return date.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);

  const { data: orders, isLoading } = useQuery<Order[]>({
    queryKey: ["/api/admin/orders"],
    retry: false,
  });

  // Фильтрация заказов по датам
  const filteredOrders = useMemo(() => {
    if (!orders) return [];
    return orders.filter(order => {
      const orderDate = new Date(order.createdAt);
      const start = new Date(startDate);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      return orderDate >= start && orderDate <= end;
    });
  }, [orders, startDate, endDate]);

  // Статистика
  const stats = useMemo(() => {
    const paidOrders = filteredOrders.filter(o => o.status === 'paid');
    const unpaidOrders = filteredOrders.filter(o => o.status !== 'paid');
    
    // Revenue only from paid orders
    const totalRevenue = paidOrders.reduce((sum, order) => sum + order.totalPrice, 0);
    const avgOrderValue = paidOrders.length > 0 ? totalRevenue / paidOrders.length : 0;

    return {
      totalOrders: filteredOrders.length,
      totalRevenue,
      paidOrders: paidOrders.length,
      unpaidOrders: unpaidOrders.length,
      avgOrderValue,
      conversionRate: filteredOrders.length > 0 ? (paidOrders.length / filteredOrders.length) * 100 : 0,
    };
  }, [filteredOrders]);

  // Данные для графика продаж по дням (только оплаченные заказы)
  const salesByDay = useMemo(() => {
    const dayMap = new Map<string, { date: string; revenue: number; orders: number }>();
    
    // Only count paid orders for revenue
    const paidOrders = filteredOrders.filter(o => o.status === 'paid');
    
    paidOrders.forEach(order => {
      const date = new Date(order.createdAt).toLocaleDateString('ru-RU');
      const existing = dayMap.get(date) || { date, revenue: 0, orders: 0 };
      dayMap.set(date, {
        date,
        revenue: existing.revenue + order.totalPrice,
        orders: existing.orders + 1,
      });
    });

    return Array.from(dayMap.values()).sort((a, b) => 
      new Date(a.date.split('.').reverse().join('-')).getTime() - 
      new Date(b.date.split('.').reverse().join('-')).getTime()
    );
  }, [filteredOrders]);

  // Данные для статусов заказов
  const ordersByStatus = useMemo(() => {
    const statusMap = new Map<string, number>();
    
    filteredOrders.forEach(order => {
      const count = statusMap.get(order.status) || 0;
      statusMap.set(order.status, count + 1);
    });

    return Array.from(statusMap.entries()).map(([name, value]) => ({ name, value }));
  }, [filteredOrders]);

  // Данные для способов доставки
  const ordersByDelivery = useMemo(() => {
    const deliveryMap = new Map<string, number>();
    
    filteredOrders.forEach(order => {
      const method = order.deliveryMethod || 'Не указано';
      const count = deliveryMap.get(method) || 0;
      deliveryMap.set(method, count + 1);
    });

    return Array.from(deliveryMap.entries()).map(([name, value]) => ({ name, value }));
  }, [filteredOrders]);

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center mb-6">
          <Button
            variant="outline"
            size="sm"
            onClick={onBack}
            className="mr-4"
            data-testid="button-back"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Назад
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Аналитика заказов</h1>
            <p className="text-sm text-gray-500">Статистика и визуализация данных о заказах</p>
          </div>
        </div>

        {/* Фильтры по датам */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Calendar className="h-5 w-5 mr-2" />
              Период анализа
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Начало периода</Label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  data-testid="input-start-date"
                />
              </div>
              <div>
                <Label>Конец периода</Label>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  data-testid="input-end-date"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {isLoading ? (
          <div className="text-center py-8">
            <div className="text-gray-500">Загрузка данных...</div>
          </div>
        ) : (
          <>
            {/* Основная статистика */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Всего заказов</CardTitle>
                  <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalOrders}</div>
                  <p className="text-xs text-muted-foreground">За выбранный период</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Оплачено</CardTitle>
                  <DollarSign className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">{stats.paidOrders}</div>
                  <p className="text-xs text-muted-foreground">Успешных заказов</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Не оплачено</CardTitle>
                  <ShoppingCart className="h-4 w-4 text-orange-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-orange-600">{stats.unpaidOrders}</div>
                  <p className="text-xs text-muted-foreground">Ожидают оплаты</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Выручка</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalRevenue.toLocaleString('ru-RU')}₽</div>
                  <p className="text-xs text-muted-foreground">Только оплаченные</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Средний чек</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{Math.round(stats.avgOrderValue).toLocaleString('ru-RU')}₽</div>
                  <p className="text-xs text-muted-foreground">По оплаченным</p>
                </CardContent>
              </Card>
            </div>

            {/* Графики */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              {/* График продаж по дням */}
              <Card>
                <CardHeader>
                  <CardTitle>Продажи по дням</CardTitle>
                  <CardDescription>Выручка и количество заказов</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={salesByDay}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis yAxisId="left" />
                      <YAxis yAxisId="right" orientation="right" />
                      <Tooltip />
                      <Legend />
                      <Line yAxisId="left" type="monotone" dataKey="revenue" stroke="#8884d8" name="Выручка (₽)" />
                      <Line yAxisId="right" type="monotone" dataKey="orders" stroke="#82ca9d" name="Заказы" />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Статусы заказов */}
              <Card>
                <CardHeader>
                  <CardTitle>Статусы заказов</CardTitle>
                  <CardDescription>Распределение по статусам</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={ordersByStatus}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, value }) => `${name}: ${value}`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {ordersByStatus.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            {/* Способы доставки */}
            <Card>
              <CardHeader>
                <CardTitle>Способы доставки</CardTitle>
                <CardDescription>Популярность методов доставки</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={ordersByDelivery}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="value" fill="#8884d8" name="Количество заказов" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Последние заказы */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Последние заказы</CardTitle>
                <CardDescription>Список заказов за выбранный период</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {filteredOrders.slice(0, 10).map((order) => (
                    <div key={order.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">#{order.orderNumber}</p>
                        <p className="text-sm text-gray-500">
                          {new Date(order.createdAt).toLocaleString('ru-RU')}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">{order.totalPrice.toLocaleString('ru-RU')}₽</p>
                        <Badge variant={order.status === 'paid' ? 'default' : 'secondary'}>
                          {order.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}
