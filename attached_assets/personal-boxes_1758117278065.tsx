import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { ArrowLeft } from "lucide-react";
import AppHeader from "@/components/app-header";
import BoxCard from "@/components/box-card";
import { useTelegram } from "@/hooks/use-telegram";
import type { Box } from "@shared/schema";

export default function PersonalBoxes() {
  const [, setLocation] = useLocation();
  const { user } = useTelegram();

  const { data: personalBoxes, isLoading } = useQuery({
    queryKey: ["/api/boxes", { category: "personal", userId: user?.id }],
    queryFn: async () => {
      const userId = user?.id?.toString() || '';
      const url = userId 
        ? `/api/boxes?category=personal&userId=${userId}`
        : "/api/boxes?category=personal";
      
      const response = await fetch(url);
      if (!response.ok) throw new Error("Failed to fetch boxes");
      return response.json() as Promise<Box[]>;
    },
    enabled: !!user?.id,
  });

  const handleSelectBox = (box: Box) => {
    // Store selected box in sessionStorage for order form
    sessionStorage.setItem("selectedBox", JSON.stringify(box));
    setLocation("/order");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Подбираем боксы для вас...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="p-4 bg-black text-white">
        <div className="flex items-center space-x-3">
          <button 
            className="p-2" 
            onClick={() => setLocation("/quiz")}
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div>
            <h2 className="font-semibold">Подбор боксов</h2>
            <p className="text-sm text-white/80">
              {personalBoxes?.length 
                ? `${personalBoxes.length} ${personalBoxes.length === 1 ? 'вариант' : personalBoxes.length < 5 ? 'варианта' : 'вариантов'} для вас`
                : 'Персональные рекомендации'
              }
            </p>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {personalBoxes && personalBoxes.length > 0 ? (
          personalBoxes.map((box) => (
            <BoxCard
              key={box.id}
              box={box}
              onSelect={handleSelectBox}
              variant="default"
              userId={user?.id?.toString()}
            />
          ))
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-600 mb-4">
              Нет подходящих боксов по вашим критериям
            </p>
            <button 
              onClick={() => setLocation("/quiz")}
              className="text-red-600 font-medium"
            >
              Пройти квиз заново
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
