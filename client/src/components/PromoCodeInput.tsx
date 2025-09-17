import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

interface PromoCodeInputProps {
  onApply: (code: string) => void;
  discount?: number;
  isApplied?: boolean;
  className?: string;
}

export default function PromoCodeInput({ 
  onApply, 
  discount = 0, 
  isApplied = false,
  className 
}: PromoCodeInputProps) {
  const [promoCode, setPromoCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleApply = async () => {
    if (!promoCode.trim()) return;
    
    setIsLoading(true);
    try {
      await onApply(promoCode.trim().toUpperCase());
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleApply();
    }
  };

  return (
    <div className={className}>
      <div className="space-y-3">
        <div className="flex gap-2">
          <Input
            data-testid="input-promo-code"
            placeholder="Введите промокод"
            value={promoCode}
            onChange={(e) => setPromoCode(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={isApplied || isLoading}
            className="flex-1"
          />
          <Button
            data-testid="button-apply-promo"
            onClick={handleApply}
            disabled={!promoCode.trim() || isApplied || isLoading}
            variant={isApplied ? "secondary" : "default"}
          >
            {isLoading ? "Проверка..." : isApplied ? "Применен" : "Применить"}
          </Button>
        </div>
        
        {isApplied && discount > 0 && (
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="bg-green-100 text-green-800">
              Скидка {discount}%
            </Badge>
            <span className="text-sm text-gray-600">Промокод применен</span>
          </div>
        )}
      </div>
    </div>
  );
}