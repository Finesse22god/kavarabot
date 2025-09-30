import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Package, ShoppingCart, Eye } from "lucide-react";
import BoxCard from "@/components/box-card";

export default function Boxes() {
  const [, setLocation] = useLocation();

  // Fetch all boxes
  const { data: boxes, isLoading } = useQuery({
    queryKey: ["/api/boxes"],
  });

  const handleSelectBox = (box: any) => {
    sessionStorage.setItem("selectedBox", JSON.stringify(box));
    setLocation("/order");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Загружаем боксы...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="p-4 bg-black text-white">
        <div className="flex items-center space-x-3">
          <div className="text-2xl">📦</div>
          <div>
            <h2 className="font-semibold">Готовые боксы</h2>
            <p className="text-sm text-gray-300">Выберите готовый комплект</p>
          </div>
        </div>
      </div>

      {/* Boxes Grid */}
      <div className="p-4">
        {boxes && (boxes as any[]).length > 0 ? (
          <div className="grid grid-cols-1 gap-4 mb-4">
            {(boxes as any[]).map((box: any) => (
              <BoxCard 
                key={box.id}
                box={box}
                onSelect={handleSelectBox}
                data-testid={`box-card-${box.id}`}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Боксы скоро появятся
            </h3>
            <p className="text-gray-600 mb-6">
              Мы работаем над созданием готовых комплектов для вас
            </p>
          </div>
        )}
      </div>

      {/* Bottom Action Buttons */}
      <div className="bg-white border-t border-gray-200 p-4 space-y-3">
        <Button
          onClick={() => setLocation("/quiz")}
          className="w-full bg-black text-white py-4 text-lg font-semibold hover:bg-gray-900"
          data-testid="button-custom-quiz"
        >
          <ShoppingCart className="w-5 h-5 mr-2" />
          Собрать бокс
        </Button>
        
        <Button
          onClick={() => setLocation("/catalog")}
          variant="outline"
          className="w-full border-2 border-black text-black py-4 text-lg font-semibold hover:bg-black hover:text-white"
          data-testid="button-open-catalog"
        >
          <Eye className="w-5 h-5 mr-2" />
          Открыть каталог
        </Button>
      </div>
    </div>
  );
}