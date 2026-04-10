import { useState, useRef, useCallback, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, Upload, Camera, RefreshCw, Download, Shirt, CheckCircle, AlertCircle, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTelegram } from "@/hooks/use-telegram";
import { useToast } from "@/hooks/use-toast";
import type { Product } from "@shared/types";

type Step = 1 | 2 | 3;
type TryonCategory = "upper_body" | "lower_body";

interface TryonStartResponse {
  predictionId: string;
  status: string;
}

interface TryonPollResponse {
  status: string;
  resultUrl: string | null;
  error: string | null;
}

const UPPER_BODY_CATEGORIES = ["Олимпийки", "Куртки", "Футболки", "Толстовки", "Лонгсливы", "Топы", "Жилеты", "Свитшоты", "Рубашки", "Верх", "Майки", "Рашгарды", "Худи"];
const LOWER_BODY_CATEGORIES = ["Брюки", "Шорты", "Леггинсы", "Лосины", "Низ", "Джоггеры"];
const EXCLUDED_CATEGORIES = ["Аксессуары", "Сумки", "Кепки", "Перчатки", "Носки", "Очки", "Бутсы", "Кроссовки", "Обувь", "Головные", "Рюкзаки", "Бутылки", "Маски", "Подшлемники"];

export default function TryOn() {
  const [, setLocation] = useLocation();
  const { hapticFeedback, webApp } = useTelegram();
  const { toast } = useToast();

  const [step, setStep] = useState<Step>(1);
  const [userPhotoFile, setUserPhotoFile] = useState<File | null>(null);
  const [userPhotoPreview, setUserPhotoPreview] = useState<string | null>(null);
  const [userPhotoUrl, setUserPhotoUrl] = useState<string | null>(null);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [category, setCategory] = useState<TryonCategory>("upper_body");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [predictionId, setPredictionId] = useState<string | null>(null);
  const [predictionStatus, setPredictionStatus] = useState<string | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [isTrying, setIsTrying] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const { data: allProducts } = useQuery<Product[]>({
    queryKey: ["/api/catalog"],
    staleTime: 60000,
  });

  const filteredProducts: Product[] = allProducts?.filter(p => {
    const cat = p.category ?? "";
    const isExcluded = EXCLUDED_CATEGORIES.some(c => cat.toLowerCase().includes(c.toLowerCase()));
    if (isExcluded) return false;
    const isLower = LOWER_BODY_CATEGORIES.some(c => cat.toLowerCase().includes(c.toLowerCase()));
    const isUpper = UPPER_BODY_CATEGORIES.some(c => cat.toLowerCase().includes(c.toLowerCase()));
    if (category === "lower_body") return isLower;
    return isUpper || (!isLower && !isExcluded);
  }) ?? [];

  // Cleanup polling and timer on unmount to prevent background requests
  useEffect(() => {
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const handleFileSelect = useCallback(async (file: File) => {
    if (!file.type.match(/^image\/(jpeg|png|webp)/)) {
      toast({ title: "Ошибка", description: "Используйте JPG, PNG или WebP", variant: "destructive" });
      return;
    }
    setUserPhotoFile(file);
    // Revoke any previous preview to avoid memory leaks
    setUserPhotoPreview(prev => { if (prev) URL.revokeObjectURL(prev); return null; });
    const preview = URL.createObjectURL(file);
    setUserPhotoPreview(preview);
    setIsUploadingPhoto(true);
    try {
      const formData = new FormData();
      formData.append("image", file);
      const res = await fetch("/api/upload/tryon-photo", { method: "POST", body: formData });
      const data = await res.json() as { url?: string; error?: string };
      if (!res.ok) throw new Error(data.error ?? "Ошибка загрузки");
      setUserPhotoUrl(data.url ?? null);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Неизвестная ошибка";
      toast({ title: "Ошибка загрузки", description: message, variant: "destructive" });
      setUserPhotoFile(null);
      setUserPhotoPreview(null);
    } finally {
      setIsUploadingPhoto(false);
    }
  }, [toast]);

  const pollStatus = (id: string) => {
    const telegramId = webApp?.initDataUnsafe?.user?.id;
    pollingRef.current = setInterval(async () => {
      try {
        const url = telegramId
          ? `/api/tryon/${id}?telegramId=${telegramId}`
          : `/api/tryon/${id}`;
        const res = await fetch(url);
        const data = await res.json() as TryonPollResponse;
        setPredictionStatus(data.status);
        if (data.status === "succeeded") {
          clearInterval(pollingRef.current!);
          clearInterval(timerRef.current!);
          setResultUrl(data.resultUrl);
          setIsTrying(false);
          setStep(3);
          hapticFeedback.notification("success");
        } else if (data.status === "failed" || data.status === "canceled") {
          clearInterval(pollingRef.current!);
          clearInterval(timerRef.current!);
          setIsTrying(false);
          toast({ title: "Ошибка примерки", description: data.error ?? "Попробуйте ещё раз", variant: "destructive" });
        }
      } catch {
        // continue polling on transient network error
      }
    }, 3000);
  };

  const startTryOn = async () => {
    if (!userPhotoUrl || !selectedProduct) return;
    hapticFeedback.impact("medium");
    setIsTrying(true);
    setResultUrl(null);
    setPredictionStatus("starting");
    setElapsed(0);

    timerRef.current = setInterval(() => setElapsed(e => e + 1), 1000);

    try {
      const telegramId = webApp?.initDataUnsafe?.user?.id;
      const res = await fetch("/api/tryon", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userPhotoUrl,
          garmentId: selectedProduct.id,
          category,
          telegramId,
        }),
      });
      const data = await res.json() as TryonStartResponse & { error?: string };
      if (!res.ok) throw new Error(data.error ?? "Ошибка запуска");
      setPredictionId(data.predictionId);
      setPredictionStatus(data.status);
      pollStatus(data.predictionId);
    } catch (err: unknown) {
      clearInterval(timerRef.current!);
      setIsTrying(false);
      const message = err instanceof Error ? err.message : "Неизвестная ошибка";
      toast({ title: "Ошибка", description: message, variant: "destructive" });
    }
  };

  const reset = () => {
    if (pollingRef.current) clearInterval(pollingRef.current);
    if (timerRef.current) clearInterval(timerRef.current);
    setStep(1);
    setUserPhotoFile(null);
    setUserPhotoPreview(prev => { if (prev) URL.revokeObjectURL(prev); return null; });
    setUserPhotoUrl(null);
    setSelectedProduct(null);
    setPredictionId(null);
    setPredictionStatus(null);
    setResultUrl(null);
    setIsTrying(false);
    setElapsed(0);
  };

  const downloadResult = async () => {
    if (!resultUrl) return;
    try {
      const res = await fetch(resultUrl);
      const blob = await res.blob();
      const objectUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = objectUrl;
      a.download = "kavara-tryon.jpg";
      a.click();
      // Revoke after a brief delay to allow the download to start
      setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
    } catch {
      window.open(resultUrl, "_blank");
    }
  };

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

  return (
    <div className="min-h-screen bg-black text-white flex flex-col pt-safe">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-4 pb-3 border-b border-white/10">
        <button onClick={() => { hapticFeedback.impact("light"); setLocation("/"); }} className="p-2 -ml-2">
          <ChevronLeft className="w-6 h-6 text-white" />
        </button>
        <h1 className="text-lg font-bold tracking-widest">ПРИМЕРКА</h1>
        {(step > 1 || userPhotoPreview) && (
          <button onClick={reset} className="ml-auto text-white/50 text-xs flex items-center gap-1">
            <RefreshCw className="w-3.5 h-3.5" />
            Сначала
          </button>
        )}
      </div>

      {/* Step indicators */}
      <div className="flex items-center gap-2 px-4 py-3">
        {([1, 2, 3] as Step[]).map(s => (
          <div key={s} className={`flex items-center gap-2 ${s < 3 ? "flex-1" : ""}`}>
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold border transition-all ${
              step > s ? "bg-white text-black border-white" :
              step === s ? "bg-white/20 text-white border-white" :
              "bg-transparent text-white/30 border-white/20"
            }`}>
              {step > s ? <CheckCircle className="w-4 h-4" /> : s}
            </div>
            <span className={`text-xs ${step === s ? "text-white" : "text-white/40"}`}>
              {s === 1 ? "Фото" : s === 2 ? "Товар" : "Результат"}
            </span>
            {s < 3 && <div className={`flex-1 h-px ${step > s ? "bg-white" : "bg-white/20"}`} />}
          </div>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-4">

        {/* STEP 1: Upload photo */}
        {step === 1 && (
          <div className="space-y-5 mt-2">
            <div>
              <h2 className="text-base font-semibold mb-1">Загрузите ваше фото</h2>
              <p className="text-white/50 text-sm">Встаньте прямо, в полный рост, на светлом фоне — результат будет лучше</p>
            </div>

            {!userPhotoPreview ? (
              <div
                className="border-2 border-dashed border-white/30 rounded-2xl flex flex-col items-center justify-center py-16 gap-4 cursor-pointer hover:border-white/60 transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center">
                  <Upload className="w-8 h-8 text-white/60" />
                </div>
                <div className="text-center">
                  <p className="text-white font-medium">Нажмите для выбора фото</p>
                  <p className="text-white/40 text-sm mt-1">JPG, PNG, WebP до 5 МБ</p>
                </div>
              </div>
            ) : (
              <div className="relative">
                <img src={userPhotoPreview} alt="Ваше фото" className="w-full max-h-96 object-contain rounded-2xl bg-white/5" />
                {isUploadingPhoto && (
                  <div className="absolute inset-0 rounded-2xl bg-black/60 flex items-center justify-center">
                    <div className="text-center">
                      <Loader2 className="w-8 h-8 animate-spin text-white mx-auto mb-2" />
                      <p className="text-white text-sm">Загрузка...</p>
                    </div>
                  </div>
                )}
                <button
                  className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/70 flex items-center justify-center"
                  onClick={() => { setUserPhotoFile(null); setUserPhotoPreview(prev => { if (prev) URL.revokeObjectURL(prev); return null; }); setUserPhotoUrl(null); }}
                >
                  <X className="w-4 h-4 text-white" />
                </button>
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={e => { const f = e.target.files?.[0]; if (f) handleFileSelect(f); e.target.value = ""; }}
            />

            <div className="bg-white/5 rounded-xl p-4 flex gap-3">
              <AlertCircle className="w-4 h-4 text-yellow-400 flex-shrink-0 mt-0.5" />
              <div className="text-xs text-white/60">
                <p className="font-medium text-white/80 mb-1">Советы для лучшего результата:</p>
                <ul className="space-y-0.5">
                  <li>• Встаньте прямо, в полный рост</li>
                  <li>• Однотонный светлый фон</li>
                  <li>• Хорошее освещение</li>
                  <li>• Облегающая одежда без принтов</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: Select product */}
        {step === 2 && (
          <div className="space-y-4 mt-2">
            <div>
              <h2 className="text-base font-semibold mb-1">Выберите вещь для примерки</h2>
              <p className="text-white/50 text-sm">Аксессуары не поддерживаются AI-моделью</p>
            </div>

            {/* Category toggle */}
            <div className="flex gap-2">
              <button
                className={`flex-1 py-2.5 rounded-xl text-sm font-medium border transition-all flex items-center justify-center gap-2 ${
                  category === "upper_body" ? "bg-white text-black border-white" : "bg-transparent text-white/60 border-white/20"
                }`}
                onClick={() => { setCategory("upper_body"); setSelectedProduct(null); }}
              >
                <Shirt className="w-4 h-4" />
                Верх
              </button>
              <button
                className={`flex-1 py-2.5 rounded-xl text-sm font-medium border transition-all flex items-center justify-center gap-2 ${
                  category === "lower_body" ? "bg-white text-black border-white" : "bg-transparent text-white/60 border-white/20"
                }`}
                onClick={() => { setCategory("lower_body"); setSelectedProduct(null); }}
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M7 2l-2 10h4l1 10h4l1-10h4L17 2H7z"/></svg>
                Низ
              </button>
            </div>

            {/* Product grid */}
            {filteredProducts.length === 0 ? (
              <div className="text-center py-12 text-white/40">
                <p>Товары не найдены</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {filteredProducts.map(product => (
                  <button
                    key={product.id}
                    className={`relative rounded-xl overflow-hidden border-2 transition-all text-left ${
                      selectedProduct?.id === product.id ? "border-white" : "border-transparent"
                    }`}
                    onClick={() => { hapticFeedback.selection(); setSelectedProduct(product); }}
                  >
                    <div className="aspect-square bg-white/5">
                      {product.imageUrl ? (
                        <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Shirt className="w-8 h-8 text-white/20" />
                        </div>
                      )}
                    </div>
                    <div className="p-2 bg-white/5">
                      <p className="text-xs font-medium text-white truncate">{product.name}</p>
                      <p className="text-xs text-white/50">{Number(product.price).toLocaleString("ru-RU")} ₽</p>
                    </div>
                    {selectedProduct?.id === product.id && (
                      <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-white flex items-center justify-center">
                        <CheckCircle className="w-4 h-4 text-black" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* STEP 3: Result */}
        {step === 3 && resultUrl && (
          <div className="space-y-4 mt-2">
            <div>
              <h2 className="text-base font-semibold mb-1">Результат примерки</h2>
              <p className="text-white/50 text-sm">{selectedProduct?.name}</p>
            </div>
            <img src={resultUrl} alt="Результат примерки" className="w-full rounded-2xl" />
            <div className="grid grid-cols-2 gap-3">
              <Button
                className="bg-white text-black hover:bg-white/90 rounded-xl py-3"
                onClick={downloadResult}
              >
                <Download className="w-4 h-4 mr-2" />
                Сохранить
              </Button>
              {"share" in navigator ? (
                <Button
                  className="bg-white/20 text-white hover:bg-white/30 rounded-xl py-3"
                  onClick={async () => {
                    try {
                      await navigator.share({ title: "KAVARA примерка", url: resultUrl! });
                    } catch {
                      window.open(resultUrl!, "_blank");
                    }
                  }}
                >
                  <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
                  Поделиться
                </Button>
              ) : (
                <Button
                  variant="outline"
                  className="border-white/30 text-white hover:bg-white/10 rounded-xl py-3"
                  onClick={reset}
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Заново
                </Button>
              )}
            </div>
            {"share" in navigator && (
              <Button
                variant="outline"
                className="w-full border-white/20 text-white/60 hover:bg-white/10 rounded-xl py-3"
                onClick={reset}
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Примерить другое
              </Button>
            )}
            {selectedProduct && (
              <Button
                className="w-full bg-white/10 text-white hover:bg-white/20 rounded-xl py-3"
                onClick={() => setLocation(`/product/${selectedProduct.id}`)}
              >
                Перейти к товару
              </Button>
            )}
          </div>
        )}

        {/* Loading overlay during try-on */}
        {isTrying && (
          <div className="fixed inset-0 bg-black/90 z-50 flex flex-col items-center justify-center px-8 text-center">
            <div className="mb-6 relative">
              <div className="w-24 h-24 rounded-full border-4 border-white/20 border-t-white animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-white text-lg font-bold">{formatTime(elapsed)}</span>
              </div>
            </div>
            <h3 className="text-white text-xl font-bold mb-2">AI создаёт примерку</h3>
            <p className="text-white/50 text-sm mb-6">Это займёт 30–90 секунд. Не закрывайте приложение.</p>
            <div className="w-full max-w-xs bg-white/10 rounded-full h-1.5 overflow-hidden">
              <div
                className="h-full bg-white rounded-full transition-all duration-1000"
                style={{ width: `${Math.min(100, (elapsed / 90) * 100)}%` }}
              />
            </div>
            <p className="text-white/30 text-xs mt-3">
              {predictionStatus === "starting" ? "Запуск модели..." :
               predictionStatus === "processing" ? "Генерация изображения..." :
               "Обработка..."}
            </p>
          </div>
        )}
      </div>

      {/* Bottom action button */}
      {!isTrying && (
        <div className="px-4 pt-3 pb-4 bg-black border-t border-white/10" style={{ paddingBottom: "max(1rem, env(safe-area-inset-bottom))" }}>
          {step === 1 && (
            <Button
              className="w-full bg-white text-black hover:bg-white/90 rounded-xl py-4 text-base font-bold"
              disabled={!userPhotoUrl || isUploadingPhoto}
              onClick={() => { hapticFeedback.impact("medium"); setStep(2); }}
            >
              {isUploadingPhoto ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Загружается...</>
              ) : userPhotoUrl ? (
                "Далее: выбрать вещь"
              ) : (
                <>
                  <Camera className="w-4 h-4 mr-2" />
                  Добавить фото
                </>
              )}
            </Button>
          )}
          {step === 2 && (
            <div className="space-y-2">
              {selectedProduct && (
                <div className="flex items-center gap-3 mb-3 bg-white/5 rounded-xl p-3">
                  {selectedProduct.imageUrl && (
                    <img src={selectedProduct.imageUrl} alt="" className="w-12 h-12 rounded-lg object-cover" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-medium truncate">{selectedProduct.name}</p>
                    <p className="text-white/50 text-xs">{Number(selectedProduct.price).toLocaleString("ru-RU")} ₽</p>
                  </div>
                  <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                </div>
              )}
              <Button
                className="w-full bg-white text-black hover:bg-white/90 rounded-xl py-4 text-base font-bold"
                disabled={!selectedProduct}
                onClick={startTryOn}
              >
                Примерить
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
