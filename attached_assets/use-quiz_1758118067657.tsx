import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { QuizResponse, InsertQuizResponse } from "@shared/schema";

export interface QuizData {
  size?: string;
  height?: number;
  weight?: number;
  goals?: string[];
  budget?: string;
}

export function useQuiz(userId?: string) {
  const [currentStep, setCurrentStep] = useState(1);
  const [quizData, setQuizData] = useState<QuizData>({});
  const queryClient = useQueryClient();

  const { data: existingResponse } = useQuery({
    queryKey: ["/api/quiz-responses/user", userId],
    enabled: !!userId,
  });

  const createQuizResponse = useMutation({
    mutationFn: async (data: InsertQuizResponse) => {
      const response = await apiRequest("POST", "/api/quiz-responses", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/quiz-responses"] });
    },
  });

  const updateQuizResponse = useMutation({
    mutationFn: async (data: Partial<InsertQuizResponse>) => {
      const response = await apiRequest("PUT", `/api/quiz-responses/user/${userId}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/quiz-responses"] });
    },
  });

  const updateQuizData = (updates: Partial<QuizData>) => {
    setQuizData(prev => ({ ...prev, ...updates }));
  };

  const nextStep = () => {
    if (currentStep < 3) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const submitQuiz = async () => {
    if (!userId) throw new Error("User ID required");

    const quizResponse: InsertQuizResponse = {
      userId,
      size: quizData.size,
      height: quizData.height,
      weight: quizData.weight,
      goals: quizData.goals,
      budget: quizData.budget,
    };

    if (existingResponse) {
      return updateQuizResponse.mutateAsync(quizResponse);
    } else {
      return createQuizResponse.mutateAsync(quizResponse);
    }
  };

  return {
    currentStep,
    quizData,
    updateQuizData,
    nextStep,
    prevStep,
    submitQuiz,
    isSubmitting: createQuizResponse.isPending || updateQuizResponse.isPending,
    existingResponse,
  };
}
