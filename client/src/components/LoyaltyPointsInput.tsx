import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Coins, Info } from "lucide-react";

interface LoyaltyPointsInputProps {
  availablePoints: number;
  onPointsUsed: (points: number) => void;
  currentUsage: number;
  maxUsablePoints: number; // Maximum points that can be used for this order
}

export default function LoyaltyPointsInput({ 
  availablePoints, 
  onPointsUsed, 
  currentUsage,
  maxUsablePoints 
}: LoyaltyPointsInputProps) {
  const [pointsToUse, setPointsToUse] = useState(currentUsage);

  const handlePointsChange = (value: string) => {
    const points = parseInt(value) || 0;
    const validPoints = Math.min(points, availablePoints, maxUsablePoints);
    setPointsToUse(validPoints);
    onPointsUsed(validPoints);
  };

  const useAllPoints = () => {
    const maxPoints = Math.min(availablePoints, maxUsablePoints);
    setPointsToUse(maxPoints);
    onPointsUsed(maxPoints);
  };

  const clearPoints = () => {
    setPointsToUse(0);
    onPointsUsed(0);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label>Использовать бонусные баллы</Label>
        <Badge variant="outline" className="flex items-center gap-1">
          <Coins className="h-3 w-3" />
          {availablePoints} доступно
        </Badge>
      </div>

      <div className="flex gap-2">
        <div className="relative flex-1">
          <Coins className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            type="number"
            placeholder="0"
            value={pointsToUse || ""}
            onChange={(e) => handlePointsChange(e.target.value)}
            min="0"
            max={Math.min(availablePoints, maxUsablePoints)}
            className="pl-10"
          />
        </div>
        <Button 
          onClick={useAllPoints}
          variant="outline" 
          size="sm"
          disabled={availablePoints === 0 || maxUsablePoints === 0}
        >
          Все
        </Button>
        <Button 
          onClick={clearPoints}
          variant="outline" 
          size="sm"
          disabled={pointsToUse === 0}
        >
          Очистить
        </Button>
      </div>

      <div className="flex items-start gap-2 text-sm text-muted-foreground">
        <Info className="h-4 w-4 mt-0.5 flex-shrink-0" />
        <div>
          <p>1 балл = 1 рубль скидки</p>
          <p>Максимум для этого заказа: {maxUsablePoints} баллов</p>
        </div>
      </div>

      {pointsToUse > 0 && (
        <div className="p-3 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
          <div className="flex items-center gap-2 text-green-700 dark:text-green-300">
            <Coins className="h-4 w-4" />
            <span className="font-medium">
              Скидка: {pointsToUse} ₽ ({pointsToUse} баллов)
            </span>
          </div>
        </div>
      )}
    </div>
  );
}