import { useLocation } from "wouter";
import { useTelegram } from "../hooks/use-telegram";
import heroVideo from "@assets/kavarademo.webm";

export default function Home() {
  const [, setLocation] = useLocation();
  const { user, isInTelegram } = useTelegram();

  const handleMenuOption = (path: string) => {
    setLocation(path);
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
      <div className="relative z-10 p-6 space-y-4 pb-20">
        <button 
          className="w-full bg-white text-black py-6 text-lg font-semibold tracking-wide hover:bg-gray-100 transition-colors rounded-xl shadow-lg"
          onClick={() => handleMenuOption("/boxes")}
          data-testid="button-ready-boxes"
        >
          ГОТОВЫЕ БОКСЫ
        </button>

        <button 
          className="w-full border-2 border-white text-white py-6 text-lg font-semibold tracking-wide hover:bg-white hover:text-black transition-colors rounded-xl shadow-lg"
          onClick={() => handleMenuOption("/catalog")}
          data-testid="button-catalog"
        >
          КАТАЛОГ ТОВАРОВ
        </button>
      </div>
    </div>
  );
}