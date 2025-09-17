import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

export interface QuizData {
  size?: string;
  height?: number;
  weight?: number;
  goals?: string[];
  budget?: string;
}

interface InsertQuizResponse {
  userId: string;
  size?: string;
  height?: number;
  weight?: number;
  goals?: string[];
  budget?: string;
}

export function useQuiz(telegramUserId?: string) {
  const [currentStep, setCurrentStep] = useState(1);
  const [quizData, setQuizData] = useState<QuizData>({});
  const queryClient = useQueryClient();

  // Get database user by telegram ID first
  const { data: dbUser } = useQuery({
    queryKey: [`/api/users/telegram/${telegramUserId}`],
    enabled: !!telegramUserId
  });

  const { data: existingResponse } = useQuery({
    queryKey: ["/api/quiz-responses/user", dbUser?.id],
    queryFn: async () => {
      const response = await fetch(`/api/quiz-responses/user/${dbUser?.id}`);
      if (!response.ok) throw new Error("Failed to fetch quiz response");
      return response.json();
    },
    enabled: !!dbUser?.id,
  });

  const createQuizResponse = useMutation({
    mutationFn: async (data: InsertQuizResponse) => {
      const response = await fetch("/api/quiz-responses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/quiz-responses"] });
      queryClient.invalidateQueries({ queryKey: ["/api/quiz-responses/user", dbUser?.id] });
    },
  });

  const updateQuizResponse = useMutation({
    mutationFn: async (data: Partial<InsertQuizResponse>) => {
      const response = await fetch(`/api/quiz-responses/user/${dbUser?.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/quiz-responses"] });
      queryClient.invalidateQueries({ queryKey: ["/api/quiz-responses/user", dbUser?.id] });
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
    if (!dbUser?.id) throw new Error("User ID required");

    const quizResponse: InsertQuizResponse = {
      userId: dbUser.id,
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