import { useLocation } from "wouter";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function About() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="p-4 bg-black text-white">
        <div className="flex items-center space-x-3">
          <button 
            className="p-2" 
            onClick={() => setLocation("/")}
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div>
            <h2 className="font-semibold">Что такое KAVARA</h2>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Brand Story */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold mb-3 flex items-center">
            <span className="text-2xl mr-2">📖</span>
            История бренда
          </h3>
          <p className="text-gray-600 leading-relaxed">
            KAVARA родился из желания сделать спорт доступным и стильным для каждого. 
            Наша команда профессиональных стилистов тщательно подбирает комплекты, 
            учитывая не только функциональность, но и модные тенденции.
          </p>
        </div>

        {/* Philosophy */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold mb-3 flex items-center">
            <span className="text-2xl mr-2">💡</span>
            Философия
          </h3>
          <p className="text-gray-600 leading-relaxed">
            Мы верим, что правильная спортивная одежда должна не только обеспечивать комфорт 
            во время тренировок, но и вдохновлять на активный образ жизни. Каждый бокс KAVARA 
            создается с любовью к деталям и пониманием потребностей современных спортсменов.
          </p>
        </div>

        {/* Advantages */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold mb-3 flex items-center">
            <span className="text-2xl mr-2">⭐</span>
            Преимущества
          </h3>
          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-primary rounded-full"></div>
              <span className="text-gray-700">Персональный подбор под ваши цели</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-primary rounded-full"></div>
              <span className="text-gray-700">Только качественные бренды</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-primary rounded-full"></div>
              <span className="text-gray-700">Экономия времени на поиск</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-primary rounded-full"></div>
              <span className="text-gray-700">Стильные комплекты от профессионалов</span>
            </div>
          </div>
        </div>

        <Button 
          className="w-full bg-primary text-white" 
          onClick={() => setLocation("/")}
        >
          Начать покупки
        </Button>
      </div>
    </div>
  );
}
