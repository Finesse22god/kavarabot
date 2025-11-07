import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Coins, Info } from "lucide-react";

interface LoyaltyPointsInputProps {
  availablePoints: number;
  onPointsUsed: (points: number) => void;
  currentUsage: number;
  maxUsablePoints: number;
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
    <div className="flex gap-2">
      <div className="relative flex-1">
        <Coins className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <Input
          type="number"
          placeholder={`Доступно: ${availablePoints} баллов`}
          value={pointsToUse || ""}
          onChange={(e) => handlePointsChange(e.target.value)}
          min="0"
          max={Math.min(availablePoints, maxUsablePoints)}
          className="pl-10 pr-10 border-2 border-gray-300 focus:border-black"
          data-testid="input-loyalty-points"
        />
        <Popover>
          <PopoverTrigger asChild>
            <button 
              className="absolute right-3 top-1/2 -translate-y-1/2 inline-flex items-center justify-center w-5 h-5 rounded-full border border-gray-300 hover:bg-gray-100 transition-colors"
              type="button"
            >
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
      <Button 
        onClick={useAllPoints}
        disabled={availablePoints === 0 || maxUsablePoints === 0}
        className="bg-black hover:bg-gray-800 text-white px-6"
        data-testid="button-use-all-points"
      >
        Все
      </Button>
    </div>
  );
}