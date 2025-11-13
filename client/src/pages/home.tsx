import { useLocation } from "wouter";
import { useTelegram } from "../hooks/use-telegram";
import { useState } from "react";
import heroVideo from "@assets/kavarademo.webm";
import logoSrc from "@assets/Vector (3)_1763029030356.png";

export default function Home() {
  const [, setLocation] = useLocation();
  const { user, isInTelegram } = useTelegram();
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);
  const [selectedSection, setSelectedSection] = useState<'catalog' | 'boxes' | null>(null);

  const handleMenuOption = (path: string, section: 'catalog' | 'boxes') => {
    setSelectedSection(section);
    setTimeout(() => {
      setLocation(path);
    }, 300);
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
      handleMenuOption("/boxes", 'boxes');
    }
    if (isRightSwipe) {
      // Swipe right - go to catalog
      handleMenuOption("/catalog", 'catalog');
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
    <div className="fixed inset-0 bg-black overflow-hidden flex flex-col">
      {/* Video Background */}
      <video
        autoPlay
        loop
        muted
        playsInline
        className="fixed top-0 left-0 w-full h-full object-cover"
      >
        <source src={heroVideo} type="video/webm" />
      </video>

      {/* Dark Overlay for text readability */}
      <div className="fixed top-0 left-0 w-full h-full bg-black/40" />

      {/* Hero Section */}
      <div className="relative z-10 flex-1 flex flex-col justify-center items-center text-center px-4 sm:px-6">
        <div className="mb-16 sm:mb-20">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-white mb-2 tracking-tight drop-shadow-lg">
            KAVARA BOX
          </h1>
          <p className="text-sm sm:text-base text-white font-normal tracking-wide drop-shadow-md">
            ГОТОВЫЙ НАБОР ДЛЯ ТВОИХ
          </p>
          <p className="text-sm sm:text-base text-white font-normal tracking-wide drop-shadow-md">
            ТРЕНИРОВОК
          </p>
          <div className="mt-4 sm:mt-8">
            <div className="w-16 sm:w-20 h-0.5 bg-white mx-auto"></div>
          </div>
        </div>

        {/* Main Actions - Centered */}
        <div className="w-full max-w-md px-4">
        <div className="relative w-full border-2 border-white rounded-full overflow-hidden shadow-xl">
          {/* Animated White Background - Left (Catalog) */}
          <div 
            className={`absolute top-2 bottom-2 left-2 bg-white transition-all duration-300 ease-out rounded-full ${
              selectedSection === 'catalog' 
                ? 'right-[calc(50%-32px)] opacity-100' 
                : 'right-[50%] opacity-0'
            }`}
          />

          {/* Animated White Background - Right (Boxes) */}
          <div 
            className={`absolute top-2 bottom-2 right-2 bg-white transition-all duration-300 ease-out rounded-full ${
              selectedSection === 'boxes' 
                ? 'left-[calc(50%-32px)] opacity-100' 
                : 'left-[50%] opacity-0'
            }`}
          />

          <div className="relative flex items-center justify-between h-20">
            {/* Catalog Section - Left */}
            <button
              onClick={() => handleMenuOption("/catalog", 'catalog')}
              className={`flex-1 h-full flex items-center justify-center font-semibold text-lg tracking-wide transition-colors duration-300 ${
                selectedSection === 'catalog' ? 'text-black' : 'text-white'
              }`}
              data-testid="button-catalog"
            >
              КАТАЛОГ
            </button>

            {/* Center Icon - Swipeable */}
            <div
              className={`absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full w-16 h-16 flex items-center justify-center shadow-lg cursor-pointer hover:scale-110 transition-all duration-300 bg-white`}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              data-testid="swipe-indicator"
            >
              <img src={logoSrc} alt="KAVARA" className="w-[28px] h-[22px]" />
            </div>

            {/* Boxes Section - Right */}
            <button
              onClick={() => handleMenuOption("/boxes", 'boxes')}
              className={`flex-1 h-full flex items-center justify-center font-semibold text-lg tracking-wide transition-colors duration-300 ${
                selectedSection === 'boxes' ? 'text-black' : 'text-white'
              }`}
              data-testid="button-boxes"
            >
              БОКСЫ
            </button>
          </div>
        </div>
        </div>
      </div>
    </div>
  );
}