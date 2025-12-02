import { useLocation } from "wouter";
import { useTelegram } from "../hooks/use-telegram";
import { useState, useRef, useEffect } from "react";
import heroVideo from "@assets/kavarademo.webm";

export default function Home() {
  const [, setLocation] = useLocation();
  const { user, isInTelegram, hapticFeedback } = useTelegram();
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);
  const [selectedSection, setSelectedSection] = useState<'catalog' | 'boxes' | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (video) {
      video.play().catch(() => {
        const handleInteraction = () => {
          video.play();
          document.removeEventListener('touchstart', handleInteraction);
          document.removeEventListener('click', handleInteraction);
        };
        document.addEventListener('touchstart', handleInteraction);
        document.addEventListener('click', handleInteraction);
      });
    }
  }, []);

  const handleMenuOption = (path: string, section: 'catalog' | 'boxes') => {
    hapticFeedback.impact('medium');
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
    <div className="fixed inset-0 bg-black overflow-hidden flex flex-col pt-safe">
      {/* Video Background */}
      <video
        ref={videoRef}
        autoPlay
        loop
        muted
        playsInline
        webkit-playsinline="true"
        className="fixed top-0 left-0 w-full h-full object-cover"
      >
        <source src={heroVideo} type="video/webm" />
      </video>
      {/* Dark Overlay for text readability */}
      <div className="fixed top-0 left-0 w-full h-full bg-black/40" />
      {/* Hero Section */}
      <div className="relative z-10 flex-1 flex flex-col justify-center items-center text-center px-4 sm:px-6">
        <div className="mb-16 sm:mb-20">
          <h1 className="sm:text-5xl md:text-6xl font-bold text-white mb-2 tracking-tight drop-shadow-lg text-[52px]">
            KAVARA BOX
          </h1>
          <p className="sm:text-base text-white font-normal tracking-wide drop-shadow-md text-[12px]">
            ГОТОВЫЙ НАБОР ДЛЯ ТВОИХ
          </p>
          <p className="sm:text-base text-white font-normal tracking-wide drop-shadow-md text-[12px]">
            ТРЕНИРОВОК
          </p>
        </div>

        {/* Main Actions - Centered */}
        <div className="flex justify-center w-full px-4">
          <div className="relative border border-white/80 rounded-full h-[40px] flex items-center" style={{ width: '200px' }}>
            <div className="flex items-center justify-between w-full px-4">
              {/* Catalog Section - Left */}
              <button
                onClick={() => handleMenuOption("/catalog", 'catalog')}
                className="flex-1 flex items-center justify-center font-medium tracking-wider text-white text-[13px]"
                data-testid="button-catalog"
              >
                КАТАЛОГ
              </button>

              {/* Center Arrows */}
              <div
                className="flex items-center justify-center gap-3 text-white/90 text-sm font-light px-2"
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                data-testid="swipe-indicator"
              >
                <span>&lt;</span>
                <span>&gt;</span>
              </div>

              {/* Boxes Section - Right */}
              <button
                onClick={() => handleMenuOption("/boxes", 'boxes')}
                className="flex-1 flex items-center justify-center font-medium tracking-wider text-white text-[13px]"
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