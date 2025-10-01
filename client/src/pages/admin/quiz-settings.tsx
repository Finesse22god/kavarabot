import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Plus, X, Settings } from "lucide-react";

interface QuizSettingsProps {
  onBack: () => void;
}

export default function QuizSettings({ onBack }: QuizSettingsProps) {
  const { toast } = useToast();
  
  // Текущие настройки квиза (в будущем можно загружать из API)
  const [sizes, setSizes] = useState(["XS", "S", "M", "L", "XL", "XXL", "3XL"]);
  const [newSize, setNewSize] = useState("");
  
  const [sportGoals, setSportGoals] = useState([
    { value: "Единоборства", label: "Единоборства", emoji: "🥊" },
    { value: "Бег/кардио", label: "Бег/кардио", emoji: "🏃‍♂️" },
    { value: "Силовые тренировки", label: "Силовые тренировки", emoji: "💪" },
    { value: "Йога", label: "Йога", emoji: "🧘‍♀️" },
    { value: "Командные виды спорта", label: "Командные виды спорта", emoji: "🏀" },
    { value: "Повседневная носка", label: "Повседневная носка", emoji: "🌟" },
  ]);
  const [newGoal, setNewGoal] = useState({ value: "", label: "", emoji: "" });
  
  const [budgetOptions, setBudgetOptions] = useState([
    { value: "10000", label: "До 10.000₽", emoji: "💰" },
    { value: "15000", label: "10.000-15.000₽", emoji: "💰💰" },
    { value: "20000", label: "15.000-20.000₽", emoji: "💰💰💰" },
    { value: "20000+", label: "Больше 20.000₽", emoji: "💰💰💰💰" },
  ]);
  const [newBudget, setNewBudget] = useState({ value: "", label: "", emoji: "" });

  const handleAddSize = () => {
    if (newSize && !sizes.includes(newSize)) {
      setSizes([...sizes, newSize]);
      setNewSize("");
      toast({
        title: "Размер добавлен",
        description: `Размер ${newSize} успешно добавлен`
      });
    }
  };

  const handleRemoveSize = (size: string) => {
    setSizes(sizes.filter(s => s !== size));
    toast({
      title: "Размер удален",
      description: `Размер ${size} удален`
    });
  };

  const handleAddGoal = () => {
    if (newGoal.value && newGoal.label) {
      setSportGoals([...sportGoals, newGoal]);
      setNewGoal({ value: "", label: "", emoji: "" });
      toast({
        title: "Цель добавлена",
        description: `Цель "${newGoal.label}" успешно добавлена`
      });
    }
  };

  const handleRemoveGoal = (value: string) => {
    setSportGoals(sportGoals.filter(g => g.value !== value));
    toast({
      title: "Цель удалена",
      description: "Цель успешно удалена"
    });
  };

  const handleAddBudget = () => {
    if (newBudget.value && newBudget.label) {
      setBudgetOptions([...budgetOptions, newBudget]);
      setNewBudget({ value: "", label: "", emoji: "" });
      toast({
        title: "Бюджет добавлен",
        description: `Вариант "${newBudget.label}" успешно добавлен`
      });
    }
  };

  const handleRemoveBudget = (value: string) => {
    setBudgetOptions(budgetOptions.filter(b => b.value !== value));
    toast({
      title: "Бюджет удален",
      description: "Вариант бюджета успешно удален"
    });
  };

  const handleSaveSettings = () => {
    // В будущем сохранять в API
    toast({
      title: "Настройки сохранены",
      description: "Настройки квиза успешно обновлены"
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto">
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
            <h1 className="text-2xl font-bold text-gray-900">Настройки квиза</h1>
            <p className="text-sm text-gray-500">Управление вопросами и вариантами ответов</p>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Размеры одежды */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Settings className="h-5 w-5 mr-2" />
                Размеры одежды
              </CardTitle>
              <CardDescription>Доступные размеры для выбора</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Новый размер (например, 4XL)"
                  value={newSize}
                  onChange={(e) => setNewSize(e.target.value.toUpperCase())}
                  data-testid="input-new-size"
                />
                <Button onClick={handleAddSize} size="sm" data-testid="button-add-size">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {sizes.map((size) => (
                  <Badge key={size} variant="secondary" className="px-3 py-1">
                    {size}
                    <X
                      className="h-3 w-3 ml-2 cursor-pointer"
                      onClick={() => handleRemoveSize(size)}
                    />
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Цели / Виды спорта */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Settings className="h-5 w-5 mr-2" />
                Виды спорта / Цели
              </CardTitle>
              <CardDescription>Варианты для второго шага квиза</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Input
                  placeholder="Название (например, Плавание)"
                  value={newGoal.label}
                  onChange={(e) => setNewGoal({ ...newGoal, label: e.target.value, value: e.target.value })}
                  data-testid="input-new-goal-label"
                />
                <Input
                  placeholder="Эмодзи (например, 🏊‍♂️)"
                  value={newGoal.emoji}
                  onChange={(e) => setNewGoal({ ...newGoal, emoji: e.target.value })}
                  data-testid="input-new-goal-emoji"
                />
                <Button onClick={handleAddGoal} size="sm" className="w-full" data-testid="button-add-goal">
                  <Plus className="h-4 w-4 mr-1" />
                  Добавить цель
                </Button>
              </div>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {sportGoals.map((goal) => (
                  <div key={goal.value} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <span className="text-sm">
                      {goal.emoji} {goal.label}
                    </span>
                    <X
                      className="h-4 w-4 cursor-pointer text-gray-500 hover:text-red-600"
                      onClick={() => handleRemoveGoal(goal.value)}
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Бюджетные опции */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Settings className="h-5 w-5 mr-2" />
                Бюджетные опции
              </CardTitle>
              <CardDescription>Варианты бюджета для третьего шага</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Input
                  placeholder="Значение (например, 25000)"
                  value={newBudget.value}
                  onChange={(e) => setNewBudget({ ...newBudget, value: e.target.value })}
                  data-testid="input-new-budget-value"
                />
                <Input
                  placeholder="Текст (например, 20.000-25.000₽)"
                  value={newBudget.label}
                  onChange={(e) => setNewBudget({ ...newBudget, label: e.target.value })}
                  data-testid="input-new-budget-label"
                />
                <Input
                  placeholder="Эмодзи (например, 💰💰💰💰💰)"
                  value={newBudget.emoji}
                  onChange={(e) => setNewBudget({ ...newBudget, emoji: e.target.value })}
                  data-testid="input-new-budget-emoji"
                />
                <Button onClick={handleAddBudget} size="sm" className="w-full" data-testid="button-add-budget">
                  <Plus className="h-4 w-4 mr-1" />
                  Добавить бюджет
                </Button>
              </div>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {budgetOptions.map((budget) => (
                  <div key={budget.value} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <span className="text-sm">
                      {budget.emoji} {budget.label}
                    </span>
                    <X
                      className="h-4 w-4 cursor-pointer text-gray-500 hover:text-red-600"
                      onClick={() => handleRemoveBudget(budget.value)}
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Инструкция и информация */}
          <Card>
            <CardHeader>
              <CardTitle>Информация</CardTitle>
              <CardDescription>О настройках квиза</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-gray-600">
                <strong>Квиз "Собрать бокс"</strong> помогает пользователям подобрать персональный набор
                спортивной одежды на основе их предпочтений.
              </p>
              <div className="space-y-2 text-sm text-gray-600">
                <p><strong>Шаг 1:</strong> Размеры (одежда, рост, вес)</p>
                <p><strong>Шаг 2:</strong> Цели и виды спорта</p>
                <p><strong>Шаг 3:</strong> Бюджет</p>
              </div>
              <div className="pt-4">
                <Button onClick={handleSaveSettings} className="w-full" data-testid="button-save-settings">
                  Сохранить настройки
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
