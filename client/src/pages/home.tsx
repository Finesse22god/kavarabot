import { useLocation } from "wouter";
import { useTelegram } from "../hooks/use-telegram";

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
    <div className="h-screen bg-white flex flex-col">
      {/* Hero Section */}
      <div className="flex-1 flex flex-col justify-center text-center px-6">
        <h1 className="text-6xl font-bold text-black mb-4 tracking-tight">
          KAVARA
        </h1>
        <p className="text-xl text-gray-700 font-medium tracking-wide">
          СПОРТИВНАЯ ОДЕЖДА
        </p>
        {user && (
          <p className="text-sm text-gray-500 mt-2">
            Добро пожаловать, {user.first_name}!
          </p>
        )}
        <div className="mt-8">
          <div className="w-20 h-0.5 bg-black mx-auto"></div>
        </div>
      </div>

      {/* Main Actions */}
      <div className="p-6 space-y-4 pb-20">
        <button 
          className="w-full bg-black text-white py-6 text-lg font-semibold tracking-wide hover:bg-gray-900 transition-colors rounded-xl"
          onClick={() => handleMenuOption("/boxes")}
        >
          ГОТОВЫЕ БОКСЫ
        </button>


        <button 
          className="w-full border-2 border-black text-black py-6 text-lg font-semibold tracking-wide hover:bg-black hover:text-white transition-colors rounded-xl"
          onClick={() => handleMenuOption("/catalog")}
        >
          КАТАЛОГ ТОВАРОВ
        </button>
      </div>
    </div>
  );
}