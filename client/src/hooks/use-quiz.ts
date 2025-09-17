import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import type { QuizResponse } from "@shared/schema";

export interface QuizData {
  telegramId: string;
  firstName?: string;
  lastName?: string;
  username?: string;
  age?: number;
  height?: number;
  weight?: number;
  size: string;
  fitnessLevel: string;
  goals: string[];
  budget: number;
  preferredStyle: string;
  sportTypes: string[];
  experiences: string[];
  availableTime: string;
  preferredBrands: string[];
  colorPreferences: string[];
  bodyType?: string;
  activityFrequency?: string;
  weatherPreference?: string;
  lifestyleFactors?: string[];
}

export function useQuiz() {
  const [currentStep, setCurrentStep] = useState(0);
  const [quizData, setQuizData] = useState<Partial<QuizData>>({});
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const submitQuizMutation = useMutation({
    mutationFn: async (data: QuizData) => {
      const response = await fetch("/api/quiz-responses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        throw new Error("Failed to submit quiz");
      }
      
      return response.json() as Promise<QuizResponse>;
    },
    onSuccess: (data) => {
      // Invalidate related queries
      queryClient.invalidateQueries({ 
        queryKey: ["/api/quiz-responses/user", data.telegramId] 
      });
      queryClient.invalidateQueries({ 
        queryKey: ["/api/boxes", { category: "personal", userId: data.telegramId }] 
      });
      
      toast({
        title: "Квиз успешно отправлен!",
        description: "Мы подберем для вас персональные рекомендации",
      });
    },
    onError: (error) => {
      console.error("Quiz submission error:", error);
      toast({
        title: "Ошибка отправки",
        description: "Попробуйте еще раз или обратитесь в поддержку",
        variant: "destructive",
      });
    },
  });

  const updateQuizData = (stepData: Partial<QuizData>) => {
    setQuizData(prev => ({ ...prev, ...stepData }));
  };

  const nextStep = () => {
    setCurrentStep(prev => prev + 1);
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(0, prev - 1));
  };

  const goToStep = (step: number) => {
    setCurrentStep(step);
  };

  const resetQuiz = () => {
    setCurrentStep(0);
    setQuizData({});
  };

  const submitQuiz = async (finalData?: Partial<QuizData>) => {
    const completeData = { ...quizData, ...finalData };
    
    // Validate required fields
    if (!completeData.telegramId || !completeData.size || !completeData.fitnessLevel) {
      toast({
        title: "Не все данные заполнены",
        description: "Пожалуйста, заполните все обязательные поля",
        variant: "destructive",
      });
      return;
    }

    return submitQuizMutation.mutate(completeData as QuizData);
  };

  const isStepComplete = (step: number): boolean => {
    switch (step) {
      case 0: // Personal Info
        return !!(quizData.age && quizData.height && quizData.weight);
      case 1: // Size & Body
        return !!(quizData.size && quizData.bodyType);
      case 2: // Fitness Level & Goals
        return !!(quizData.fitnessLevel && quizData.goals && quizData.goals.length > 0);
      case 3: // Sports & Activities
        return !!(quizData.sportTypes && quizData.sportTypes.length > 0);
      case 4: // Style & Preferences
        return !!(quizData.preferredStyle && quizData.colorPreferences && quizData.colorPreferences.length > 0);
      case 5: // Budget & Brands
        return !!(quizData.budget);
      default:
        return false;
    }
  };

  const canProceed = isStepComplete(currentStep);

  const getStepProgress = () => {
    const totalSteps = 6;
    return Math.round(((currentStep + 1) / totalSteps) * 100);
  };

  return {
    currentStep,
    quizData,
    updateQuizData,
    nextStep,
    prevStep,
    goToStep,
    resetQuiz,
    submitQuiz,
    isStepComplete,
    canProceed,
    getStepProgress,
    isSubmitting: submitQuizMutation.isPending,
    submitError: submitQuizMutation.error,
  };
}