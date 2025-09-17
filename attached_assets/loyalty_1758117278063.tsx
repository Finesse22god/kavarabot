import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Star, Gift, Trophy, Users, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useTelegram } from "@/hooks/use-telegram";

export default function Loyalty() {
  const { toast } = useToast();
  const { user: telegramUser } = useTelegram();
  const queryClient = useQueryClient();

  // Show loading only if we don't have telegram user
  if (!telegramUser?.id) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  // Fetch user data from our database
  const { data: userData, isLoading: userLoading, error: userError } = useQuery({
    queryKey: [`/api/users/telegram/${telegramUser.id.toString()}`],
    enabled: !!telegramUser?.id,
    retry: 1,
  });

  // Fetch loyalty stats
  const { data: loyaltyStats, isLoading: statsLoading } = useQuery({
    queryKey: [`/api/loyalty/${userData?.id}/stats`],
    enabled: !!userData?.id,
    retry: 1,
  });

  // Fetch loyalty transactions
  const { data: transactions, isLoading: transactionsLoading } = useQuery({
    queryKey: [`/api/loyalty/${userData?.id}/transactions`],
    enabled: !!userData?.id,
    retry: 1,
  });

  // Show loading spinner only for initial user data loading
  if (userLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  // Show error if user not found
  if (userError || !userData) {
    return (
      <div className="container mx-auto px-4 py-6 text-center">
        <p className="text-muted-foreground">Ошибка загрузки данных пользователя</p>
      </div>
    );
  }

  const userTransactions = transactions || [];
  const stats = loyaltyStats || { totalPoints: 0, totalEarned: 0, totalRedeemed: 0, totalReferrals: 0 };

  // Generate referral code mutation
  const generateReferralCodeMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/loyalty/${userData?.id}/generate-referral-code`, {
        method: "POST",
      });
      if (!response.ok) {
        throw new Error("Failed to generate referral code");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/users/telegram/${telegramUser?.id?.toString()}`] });
      toast({
        title: "Успех",
        description: "Промокод создан!",
      });
    },
    onError: () => {
      toast({
        title: "Ошибка",
        description: "Не удалось создать промокод",
        variant: "destructive",
      });
    },
  });

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">Программа лояльности</h1>
        <p className="text-muted-foreground">
          Используйте промокоды для получения скидок и накапливайте баллы
        </p>
      </div>

      {/* Points Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6 text-center">
            <Star className="h-8 w-8 mx-auto mb-2 text-yellow-500" />
            <div className="text-2xl font-bold">
              {statsLoading ? (
                <div className="animate-pulse bg-gray-200 h-8 w-16 rounded mx-auto"></div>
              ) : (
                stats.totalPoints
              )}
            </div>
            <p className="text-sm text-muted-foreground">Доступных баллов</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6 text-center">
            <Trophy className="h-8 w-8 mx-auto mb-2 text-primary" />
            <div className="text-2xl font-bold">
              {statsLoading ? (
                <div className="animate-pulse bg-gray-200 h-8 w-16 rounded mx-auto"></div>
              ) : (
                stats.totalEarned
              )}
            </div>
            <p className="text-sm text-muted-foreground">Всего заработано</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6 text-center">
            <Clock className="h-8 w-8 mx-auto mb-2 text-green-500" />
            <div className="text-2xl font-bold">
              {statsLoading ? (
                <div className="animate-pulse bg-gray-200 h-8 w-16 rounded mx-auto"></div>
              ) : (
                stats.totalRedeemed
              )}
            </div>
            <p className="text-sm text-muted-foreground">Потрачено баллов</p>
          </CardContent>
        </Card>
      </div>

      {/* Your Personal Promo Code */}
      <Card className="bg-gradient-to-br from-red-50 to-black/5 border border-red-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-600">
            <Gift className="h-5 w-5" />
            Ваш промокод
          </CardTitle>
          <CardDescription>
            Делитесь своим кодом с друзьями и получайте 10% баллами от их покупок
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {userData?.referralCode ? (
            <div className="space-y-4">
              <div className="p-4 bg-white border border-red-200 rounded-lg">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Ваш промокод:</p>
                    <p className="text-2xl font-bold font-mono text-red-600">{userData.referralCode}</p>
                  </div>
                  <Button
                    onClick={() => {
                      navigator.clipboard.writeText(userData.referralCode || "");
                      toast({
                        title: "Скопировано!",
                        description: "Промокод скопирован в буфер обмена",
                      });
                    }}
                    className="bg-red-600 hover:bg-red-700 flex items-center gap-2"
                  >
                    <Gift className="h-4 w-4" />
                    Копировать
                  </Button>
                </div>
              </div>
              
              <div className="bg-white/50 p-4 rounded-lg border border-red-100">
                <h4 className="font-semibold mb-3 text-red-700">Как это работает:</h4>
                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 bg-red-600 text-white rounded-full flex items-center justify-center text-xs font-bold">1</span>
                    <span>Отправьте промокод другу</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 bg-red-600 text-white rounded-full flex items-center justify-center text-xs font-bold">2</span>
                    <span>Друг покупает товар с вашим промокодом</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 bg-red-600 text-white rounded-full flex items-center justify-center text-xs font-bold">3</span>
                    <span>Вы получаете 10% баллами от суммы заказа</span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-white border border-red-100 rounded-lg">
                <span className="text-sm font-medium text-gray-700">Приглашенных друзей</span>
                <Badge variant="secondary" className="bg-red-100 text-red-700">
                  {statsLoading ? "..." : stats.totalReferrals}
                </Badge>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <Gift className="w-16 h-16 text-red-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-700 mb-2">Создайте свой промокод</h3>
              <p className="text-gray-600 mb-6">Получите персональный промокод для приглашения друзей</p>
              <Button 
                onClick={() => generateReferralCodeMutation.mutate()}
                disabled={generateReferralCodeMutation.isPending}
                className="bg-red-600 hover:bg-red-700"
              >
                {generateReferralCodeMutation.isPending ? "Создание..." : "Создать промокод"}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* For Trainers */}
      <Card className="border-2 border-dashed border-primary/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Для тренеров и фитнес-экспертов
          </CardTitle>
          <CardDescription>
            Присоединяйтесь к партнерской программе KAVARA
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-primary/5 rounded-lg">
              <div className="w-12 h-12 bg-primary text-white rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-2">%</div>
              <h4 className="font-semibold mb-1">Индивидуальные скидки</h4>
              <p className="text-sm text-muted-foreground">Получите персональный промокод с вашей скидкой</p>
            </div>
            <div className="text-center p-4 bg-primary/5 rounded-lg">
              <div className="w-12 h-12 bg-primary text-white rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-2">💰</div>
              <h4 className="font-semibold mb-1">Комиссия с продаж</h4>
              <p className="text-sm text-muted-foreground">Зарабатывайте на каждом заказе ваших клиентов</p>
            </div>
            <div className="text-center p-4 bg-primary/5 rounded-lg">
              <div className="w-12 h-12 bg-primary text-white rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-2">📊</div>
              <h4 className="font-semibold mb-1">Аналитика продаж</h4>
              <p className="text-sm text-muted-foreground">Отслеживайте статистику использования промокодов</p>
            </div>
          </div>
          
          <div className="text-center p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 rounded-lg border">
            <h4 className="font-semibold mb-2">Хотите стать партнером?</h4>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p><strong>Продажи:</strong> sales@kavarabrand.com (+7 925 131-51-01)</p>
              <p><strong>Партнерство:</strong> info@kavarabrand.com (+7 916 091-56-54)</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Transaction History */}
      <Card>
        <CardHeader>
          <CardTitle>История баллов</CardTitle>
          <CardDescription>Последние операции с баллами лояльности</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {userTransactions.length > 0 ? (
              userTransactions.map((transaction: any) => (
                <div key={transaction.id} className="flex justify-between items-center p-3 border border-gray-200 rounded-lg">
                  <div>
                    <p className="font-medium">{transaction.description}</p>
                    <p className="text-sm text-gray-600">{new Date(transaction.createdAt).toLocaleDateString('ru-RU')}</p>
                  </div>
                  <div className="text-right">
                    <Badge 
                      variant={transaction.type === 'earned' ? 'default' : transaction.type === 'bonus' ? 'secondary' : 'destructive'}
                      className={transaction.type === 'earned' ? 'bg-green-100 text-green-800' : 
                                transaction.type === 'bonus' ? 'bg-blue-100 text-blue-800' :
                                'bg-red-100 text-red-800'}
                    >
                      {transaction.type === 'redeemed' ? '-' : '+'}{Math.abs(transaction.points)} баллов
                    </Badge>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <Trophy className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">История транзакций пуста</p>
                <p className="text-sm text-muted-foreground mt-1">Совершите покупку, чтобы начать зарабатывать баллы</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}