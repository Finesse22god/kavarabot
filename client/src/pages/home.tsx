import { useLocation } from "wouter";
import { useTelegram } from "../hooks/use-telegram";
import { ChevronDown } from "lucide-react";
import { useState } from "react";
import heroVideo from "@assets/kavarademo.webm";

export default function Home() {
  const [, setLocation] = useLocation();
  const { user, isInTelegram } = useTelegram();
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);

  const handleMenuOption = (path: string) => {
    setLocation(path);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe) {
      // Swipe left - go to boxes
      setLocation("/boxes");
    }
    if (isRightSwipe) {
      // Swipe right - go to catalog
      setLocation("/catalog");
    }

    setTouchStart(0);
    setTouchEnd(0);
  };

  // Show message if not in Telegram
  if (!isInTelegram) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-6">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-black mb-4">KAVARA</h1>
          <p className="text-gray-600 mb-6">
            Это приложение работает только в Telegram
          </p>
          <button 
            className="bg-blue-500 text-white px-6 py-3 rounded-xl"
            onClick={() => window.open('https://t.me/kavaraappbot', '_blank')}
          >
            Открыть в Telegram
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-screen bg-black overflow-hidden flex flex-col">
      {/* Video Background */}
      <video
        autoPlay
        loop
        muted
        playsInline
        className="absolute top-0 left-0 w-full h-full object-cover"
      >
        <source src={heroVideo} type="video/webm" />
      </video>

      {/* Dark Overlay for text readability */}
      <div className="absolute top-0 left-0 w-full h-full bg-black/40" />

      {/* Hero Section */}
      <div className="relative z-10 flex-1 flex flex-col justify-center text-center px-6">
        <h1 className="text-5xl font-bold text-white mb-2 tracking-tight drop-shadow-lg">
          KAVARA BOX
        </h1>
        <p className="text-base text-white font-normal tracking-wide drop-shadow-md">
          ГОТОВЫЙ НАБОР ДЛЯ ТВОИХ
        </p>
        <p className="text-base text-white font-normal tracking-wide drop-shadow-md">
          ТРЕНИРОВОК
        </p>
        <div className="mt-8">
          <div className="w-20 h-0.5 bg-white mx-auto"></div>
        </div>
      </div>

      {/* Main Actions */}
      <div className="relative z-10 p-6 pb-24">
        <div className="relative w-full border-2 border-white rounded-full overflow-hidden shadow-xl">
          <div className="flex items-center justify-between h-20">
            {/* Catalog Section - Left */}
            <button
              onClick={() => handleMenuOption("/catalog")}
              className="flex-1 h-full flex items-center justify-center text-white font-semibold text-lg tracking-wide hover:bg-white/10 transition-colors"
              data-testid="button-catalog"
            >
              КАТАЛОГ
            </button>

            {/* Center Icon - Swipeable */}
            <div
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-full w-16 h-16 flex items-center justify-center shadow-lg cursor-pointer hover:scale-110 transition-transform"
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              data-testid="swipe-indicator"
            >
              <ChevronDown className="w-8 h-8 text-black" />
            </div>

            {/* Boxes Section - Right */}
            <button
              onClick={() => handleMenuOption("/boxes")}
              className="flex-1 h-full flex items-center justify-center text-white font-semibold text-lg tracking-wide hover:bg-white/10 transition-colors"
              data-testid="button-boxes"
            >
              БОКСЫ
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}