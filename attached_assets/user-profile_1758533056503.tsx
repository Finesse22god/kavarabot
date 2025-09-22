import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, User, Phone, Mail, MapPin, Package, Calendar, ShoppingCart } from "lucide-react";

interface User {
  id: string;
  firstName?: string;
  lastName?: string;
  username?: string;
  telegramId: string;
  createdAt: string;
  referralCode?: string;
}

interface UserProfileProps {
  user: User;
  onBack: () => void;
}

export default function UserProfile({ user, onBack }: UserProfileProps) {
  // Fetch user orders
  const { data: userOrders } = useQuery({
    queryKey: [`/api/admin/users/${user.id}/orders`],
    retry: false,
  });

  // Fetch user loyalty stats
  const { data: loyaltyStats } = useQuery({
    queryKey: [`/api/admin/users/${user.id}/loyalty`],
    retry: false,
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">Ожидает оплаты</Badge>;
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

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-bold">
          Профиль пользователя: {user.firstName} {user.lastName}
        </h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* User Info */}
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Основная информация
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-gray-600">Имя</p>
                <p className="font-medium">{user.firstName} {user.lastName}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Telegram</p>
                <p className="font-medium">@{user.username}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Telegram ID</p>
                <p className="font-medium">{user.telegramId}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Дата регистрации</p>
                <p className="font-medium">{new Date(user.createdAt).toLocaleDateString('ru-RU')}</p>
              </div>
              {user.referralCode && (
                <div>
                  <p className="text-sm text-gray-600">Реферальный код</p>
                  <Badge variant="secondary" className="font-mono">{user.referralCode}</Badge>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Loyalty Stats */}
          <Card>
            <CardHeader>
              <CardTitle>Статистика лояльности</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Доступно баллов</span>
                <span className="font-medium">{loyaltyStats?.totalPoints || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Всего заработано</span>
                <span className="font-medium">{loyaltyStats?.totalEarned || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Приглашено друзей</span>
                <span className="font-medium">{loyaltyStats?.totalReferrals || 0}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Orders */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5" />
                История заказов
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {userOrders?.map((order: any) => (
                  <div key={order.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-semibold">Заказ #{order.orderNumber}</h3>
                        <p className="text-sm text-gray-600">{new Date(order.createdAt).toLocaleDateString('ru-RU')}</p>
                      </div>
                      <div className="text-right">
                        {getStatusBadge(order.status)}
                        <p className="text-lg font-bold mt-1">{order.totalPrice}₽</p>
                      </div>
                    </div>
                    
                    <div className="grid md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <div className="flex items-center gap-1 mb-1">
                          <User className="h-4 w-4 text-gray-400" />
                          <span className="text-gray-600">Контакты:</span>
                        </div>
                        <p>{order.customerName}</p>
                        {order.customerEmail && (
                          <div className="flex items-center gap-1">
                            <Mail className="h-4 w-4 text-gray-400" />
                            <span>{order.customerEmail}</span>
                          </div>
                        )}
                        {order.customerPhone && (
                          <div className="flex items-center gap-1">
                            <Phone className="h-4 w-4 text-gray-400" />
                            <span>{order.customerPhone}</span>
                          </div>
                        )}
                      </div>
                      
                      <div>
                        <div className="flex items-center gap-1 mb-1">
                          <MapPin className="h-4 w-4 text-gray-400" />
                          <span className="text-gray-600">Доставка:</span>
                        </div>
                        <p>{order.deliveryMethod}</p>
                        {order.deliveryAddress && <p>{order.deliveryAddress}</p>}
                      </div>
                    </div>

                    {order.boxName && (
                      <div className="mt-3 pt-3 border-t border-gray-100">
                        <div className="flex items-center gap-1">
                          <Package className="h-4 w-4 text-gray-400" />
                          <span className="text-sm text-gray-600">Товар:</span>
                          <span className="text-sm font-medium">{order.boxName}</span>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
                {!userOrders?.length && (
                  <div className="text-center py-8">
                    <ShoppingCart className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground">У пользователя пока нет заказов</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}