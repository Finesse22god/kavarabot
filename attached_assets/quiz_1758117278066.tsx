import { useState } from "react";
import { useLocation } from "wouter";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import AppHeader from "@/components/app-header";
import { useQuiz } from "@/hooks/use-quiz";
import { useTelegram } from "@/hooks/use-telegram";

const sizeOptions = ["XS", "S", "M", "L", "XL", "XXL"];

const goalOptions = [
  { value: "Единоборства", label: "Единоборства", emoji: "🥊" },
  { value: "Бег/кардио", label: "Бег/кардио", emoji: "🏃‍♂️" },
  { value: "Силовые тренировки", label: "Силовые тренировки", emoji: "💪" },
  { value: "Йога", label: "Йога", emoji: "🧘‍♀️" },
  {
    value: "Командные виды спорта",
    label: "Командные виды спорта",
    emoji: "🏀",
  },
  { value: "Повседневная носка", label: "Повседневная носка", emoji: "🌟" },
];

const budgetOptions = [
  { value: "10000", label: "До 10.000₽", emoji: "💰" },
  { value: "15000", label: "10.000-15.000₽", emoji: "💰💰" },
  { value: "20000", label: "15.000-20.000₽", emoji: "💰💰💰" },
  { value: "20000+", label: "Больше 20.000₽", emoji: "💰💰💰💰" },
];

export default function Quiz() {
  const [, setLocation] = useLocation();
  const { user, isInTelegram } = useTelegram();
  const {
    currentStep,
    quizData,
    updateQuizData,
    nextStep,
    prevStep,
    submitQuiz,
    isSubmitting,
  } = useQuiz(user?.id.toString());

  // Redirect if not in Telegram
  if (!isInTelegram || !user) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-black mb-4">
            Доступ запрещен
          </h1>
          <p className="text-gray-600 mb-6">
            Квиз доступен только пользователям Telegram
          </p>
          <Button onClick={() => setLocation("/")}>На главную</Button>
        </div>
      </div>
    );
  }

  const handleSubmitQuiz = async () => {
    try {
      await submitQuiz();
      setLocation("/personal-boxes");
    } catch (error) {
      console.error("Failed to submit quiz:", error);
    }
  };

  const isStepValid = () => {
    switch (currentStep) {
      case 1:
        return quizData.size && quizData.height && quizData.weight;
      case 2:
        return quizData.goals && quizData.goals.length > 0;
      case 3:
        return quizData.budget;
      default:
        return false;
    }
  };

  const progressDots = Array.from({ length: 3 }, (_, i) => (
    <div
      key={i}
      className={`w-2 h-2 rounded-full ${
        i + 1 <= currentStep ? "bg-white" : "bg-white/30"
      }`}
    />
  ));

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Quiz Header */}
      <div className="p-4 bg-black text-white">
        <div className="flex items-center space-x-3">
          <button className="p-2" onClick={() => setLocation("/")}>
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div>
            <h2 className="font-semibold">Квалификационный опрос</h2>
            <div className="flex items-center space-x-2 mt-1">
              <div className="flex space-x-1">{progressDots}</div>
              <span className="text-sm text-white/80">
                Шаг {currentStep} из 3
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Step 1: Sizes */}
      {currentStep === 1 && (
        <div className="p-4">
          <h3 className="text-lg font-semibold mb-4">Укажите ваши размеры</h3>

          <div className="mb-6">
            <Label className="block text-sm font-medium text-gray-700 mb-2">
              Размер одежды
            </Label>
            <div className="grid grid-cols-3 gap-2">
              {sizeOptions.map((size) => (
                <Button
                  key={size}
                  variant={quizData.size === size ? "default" : "outline"}
                  className={`selection-btn ${quizData.size === size ? "selected" : ""}`}
                  onClick={() => updateQuizData({ size })}
                >
                  {size}
                </Button>
              ))}
            </div>
          </div>

          <div className="mb-4">
            <Label
              htmlFor="height"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Рост (см)
            </Label>
            <Input
              id="height"
              type="number"
              placeholder="175"
              value={quizData.height || ""}
              onChange={(e) =>
                updateQuizData({
                  height: parseInt(e.target.value) || undefined,
                })
              }
            />
          </div>

          <div className="mb-6">
            <Label
              htmlFor="weight"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Вес (кг)
            </Label>
            <Input
              id="weight"
              type="number"
              placeholder="70"
              value={quizData.weight || ""}
              onChange={(e) =>
                updateQuizData({
                  weight: parseInt(e.target.value) || undefined,
                })
              }
            />
          </div>

          <Button
            className="w-full bg-primary text-white"
            onClick={nextStep}
            disabled={!isStepValid()}
          >
            Далее
          </Button>
        </div>
      )}

      {/* Step 2: Goals */}
      {currentStep === 2 && (
        <div className="p-4">
          <h3 className="text-lg font-semibold mb-4">Цели покупки</h3>

          <div className="space-y-3">
            {goalOptions.map((goal) => {
              const isSelected = quizData.goals?.includes(goal.value) || false;
              return (
                <Button
                  key={goal.value}
                  variant="outline"
                  className={`goal-btn ${isSelected ? "selected" : ""}`}
                  onClick={() => {
                    const currentGoals = quizData.goals || [];
                    const newGoals = isSelected
                      ? currentGoals.filter((g) => g !== goal.value)
                      : [...currentGoals, goal.value];
                    updateQuizData({ goals: newGoals });
                  }}
                >
                  <span className="text-xl">{goal.emoji}</span>
                  <span>{goal.label}</span>
                </Button>
              );
            })}
          </div>

          <div className="mt-6 flex space-x-3">
            <Button variant="outline" className="flex-1" onClick={prevStep}>
              Назад
            </Button>
            <Button
              className="flex-1 bg-primary text-white"
              onClick={nextStep}
              disabled={!isStepValid()}
            >
              Далее
            </Button>
          </div>
        </div>
      )}

      {/* Step 3: Budget */}
      {currentStep === 3 && (
        <div className="p-4">
          <h3 className="text-lg font-semibold mb-4">Ваш бюджет</h3>

          <div className="space-y-3">
            {budgetOptions.map((budget) => (
              <Button
                key={budget.value}
                variant="outline"
                className={`goal-btn ${quizData.budget === budget.value ? "selected" : ""}`}
                onClick={() => updateQuizData({ budget: budget.value })}
              >
                <span className="text-xl">{budget.emoji}</span>
                <span>{budget.label}</span>
              </Button>
            ))}
          </div>

          <div className="mt-6 flex space-x-3">
            <Button variant="outline" className="flex-1" onClick={prevStep}>
              Назад
            </Button>
            <Button
              className="flex-1 bg-primary text-white"
              onClick={handleSubmitQuiz}
              disabled={!isStepValid() || isSubmitting}
            >
              {isSubmitting ? "Обрабатываем..." : "Подобрать боксы"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
