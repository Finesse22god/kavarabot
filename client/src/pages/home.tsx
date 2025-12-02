import { useLocation } from "wouter";
import { useTelegram } from "../hooks/use-telegram";
import { useState, useRef, useEffect } from "react";
import heroVideo from "@assets/kavarademo.webm";
import arrowLeft from "@assets/Rectangle_1539_1764675275625.png";
import arrowRight from "@assets/d5aacb29-e723-4656-9c06-ab1e385ac0b2_1764675280619.png";

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
      <div className="relative z-10 flex-1 flex flex-col justify-center items-center text-center px-4 sm:px-6" style={{ marginTop: '-20px' }}>
        <div className="mb-6 sm:mb-8 flex flex-col items-center">
          <h1 className="sm:text-5xl md:text-6xl font-bold text-white mb-0 tracking-wide drop-shadow-lg whitespace-nowrap text-[43px]" style={{ fontFamily: "'IBM Plex Sans', sans-serif" }}>
            KAVARA BOX
          </h1>
          <p className="sm:text-base text-white font-normal tracking-wide drop-shadow-md text-[12px] -mt-3 whitespace-nowrap">ГОТОВЫЙ НАБОР ДЛЯ ТВОИХ ТРЕНИРОВОК</p>
        </div>

        {/* Main Actions - Centered */}
        <div className="flex justify-center w-full px-4">
          <div className="relative border border-white/80 rounded-full h-[50px] flex items-center w-full max-w-[240px]">
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
                className="flex items-center justify-center gap-4 px-2"
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                data-testid="swipe-indicator"
              >
                <img src={arrowLeft} alt="<" className="w-3 h-3 object-contain" />
                <img src={arrowRight} alt=">" className="w-3 h-3 object-contain" />
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