import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
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

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label>Использовать бонусные баллы</Label>
        <div className="flex items-center gap-1.5">
          <Badge variant="outline" className="flex items-center gap-1">
            <Coins className="h-3 w-3" />
            {availablePoints} доступно
          </Badge>
          <Popover>
            <PopoverTrigger asChild>
              <button className="inline-flex items-center justify-center w-5 h-5 rounded-full border border-gray-300 hover:bg-gray-100 transition-colors">
                <Info className="h-3 w-3 text-gray-600" />
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-3" side="left" align="start">
              <div className="text-sm space-y-1">
                <p className="font-medium">1 балл = 1 рубль скидки</p>
                <p className="text-muted-foreground">Максимум: {maxUsablePoints} баллов</p>
              </div>
            </PopoverContent>
          </Popover>
        </div>
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
      </div>
    </div>
  );
}