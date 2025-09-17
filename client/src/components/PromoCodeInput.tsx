import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Loader2, CheckCircle, XCircle, Tag } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface PromoCodeInputProps {
  onPromoCodeApplied: (discount: { 
    code: string; 
    discountPercent: number; 
    discountAmount: number; 
    trainer?: any 
  }) => void;
  onPromoCodeRemoved: () => void;
  orderAmount: number;
  appliedPromoCode?: string;
}

export default function PromoCodeInput({ 
  onPromoCodeApplied, 
  onPromoCodeRemoved, 
  orderAmount,
  appliedPromoCode 
}: PromoCodeInputProps) {
  const [promoCode, setPromoCode] = useState("");
  const [isValidating, setIsValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<any>(null);

  const validatePromoCode = async () => {
    if (!promoCode.trim()) return;

    setIsValidating(true);
    try {
      const response = await fetch("/api/promo-codes/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: promoCode.trim() })
      });
      const result = await response.json();

      if (result.isValid) {
        const discountAmount = Math.floor(orderAmount * (result.discountPercent / 100));
        setValidationResult(result);
        onPromoCodeApplied({
          code: promoCode.trim(),
          discountPercent: result.discountPercent,
          discountAmount,
          trainer: result.trainer
        });
      } else {
        setValidationResult(result);
      }
    } catch (error) {
      console.error("Error validating promo code:", error);
      setValidationResult({ 
        isValid: false, 
        error: "Ошибка при проверке промокода" 
      });
    } finally {
      setIsValidating(false);
    }
  };

  const removePromoCode = () => {
    setPromoCode("");
    setValidationResult(null);
    onPromoCodeRemoved();
  };

  if (appliedPromoCode) {
    return (
      <div className="space-y-2">
        <Label>Промокод</Label>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-green-500" />
            {appliedPromoCode}
            {validationResult?.trainer && (
              <span className="text-sm text-muted-foreground">
                (тренер: {validationResult.trainer.name})
              </span>
            )}
          </Badge>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={removePromoCode}
          >
            Удалить
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <Label htmlFor="promoCode">Промокод</Label>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Tag className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            id="promoCode"
            placeholder="Введите промокод"
            value={promoCode}
            onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
            className="pl-10"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                validatePromoCode();
              }
            }}
          />
        </div>
        <Button 
          onClick={validatePromoCode}
          disabled={!promoCode.trim() || isValidating}
          variant="outline"
        >
          {isValidating ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            "Применить"
          )}
        </Button>
      </div>
      
      {validationResult && (
        <div className="flex items-center gap-2 text-sm">
          {validationResult.isValid ? (
            <>
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span className="text-green-600">
                Промокод применен! Скидка {validationResult.discountPercent}%
                {validationResult.trainer && (
                  <span className="text-muted-foreground">
                    {" "}(от тренера {validationResult.trainer.name})
                  </span>
                )}
              </span>
            </>
          ) : (
            <>
              <XCircle className="h-4 w-4 text-red-500" />
              <span className="text-red-600">
                {validationResult.error || "Промокод недействителен"}
              </span>
            </>
          )}
        </div>
      )}
    </div>
  );
}