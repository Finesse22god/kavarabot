import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Coins } from "lucide-react";

interface LoyaltyPointsInputProps {
  availablePoints: number;
  maxDiscount: number;
  onApply: (points: number) => void;
  appliedPoints?: number;
  className?: string;
}

export default function LoyaltyPointsInput({ 
  availablePoints, 
  maxDiscount, 
  onApply, 
  appliedPoints = 0,
  className 
}: LoyaltyPointsInputProps) {
  const [pointsToUse, setPointsToUse] = useState(appliedPoints.toString());
  const [isLoading, setIsLoading] = useState(false);

  const handleApply = async () => {
    const points = parseInt(pointsToUse) || 0;
    if (points <= 0 || points > availablePoints) return;
    
    setIsLoading(true);
    try {
      await onApply(points);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUseAll = () => {
    const maxPoints = Math.min(availablePoints, maxDiscount);
    setPointsToUse(maxPoints.toString());
  };

  const pointsValue = parseInt(pointsToUse) || 0;
  const isValid = pointsValue > 0 && pointsValue <= availablePoints && pointsValue <= maxDiscount;
  const isApplied = appliedPoints > 0;

  return (
    <div className={className}>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Coins className="w-4 h-4 text-yellow-500" />
            <span className="text-sm font-medium">Баллы лояльности</span>
          </div>
          <Badge variant="outline" className="text-xs">
            Доступно: {availablePoints}
          </Badge>
        </div>

        <div className="flex gap-2">
          <Input
            data-testid="input-loyalty-points"
            type="number"
            placeholder="Количество баллов"
            value={pointsToUse}
            onChange={(e) => setPointsToUse(e.target.value)}
            min="0"
            max={Math.min(availablePoints, maxDiscount)}
            disabled={isApplied || isLoading}
            className="flex-1"
          />
          <Button
            data-testid="button-use-all-points"
            onClick={handleUseAll}
            variant="outline"
            disabled={isApplied || isLoading || availablePoints === 0}
            className="whitespace-nowrap"
          >
            Все
          </Button>
          <Button
            data-testid="button-apply-points"
            onClick={handleApply}
            disabled={!isValid || isApplied || isLoading}
            variant={isApplied ? "secondary" : "default"}
          >
            {isLoading ? "Применение..." : isApplied ? "Применено" : "Применить"}
          </Button>
        </div>
        
        {isApplied && (
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
              Использовано: {appliedPoints} баллов
            </Badge>
            <span className="text-sm text-gray-600">≈ {appliedPoints}₽ скидка</span>
          </div>
        )}

        <p className="text-xs text-gray-500">
          Максимум к использованию: {Math.min(availablePoints, maxDiscount)} баллов (до {maxDiscount}% от суммы)
        </p>
      </div>
    </div>
  );
}