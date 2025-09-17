import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Home } from "lucide-react";

export default function NotFound() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center p-6">
        <div className="text-8xl mb-6">🔍</div>
        <h1 className="text-4xl font-bold text-black mb-4">404</h1>
        <p className="text-xl text-gray-600 mb-6">
          Страница не найдена
        </p>
        <p className="text-gray-500 mb-8">
          Запрашиваемая страница не существует или была перемещена.
        </p>
        <div className="space-y-3">
          <Button 
            onClick={() => setLocation("/")}
            className="w-full bg-black text-white hover:bg-gray-800"
            size="lg"
          >
            <Home className="w-5 h-5 mr-2" />
            На главную
          </Button>
          <Button 
            onClick={() => window.history.back()}
            variant="outline"
            className="w-full"
            size="lg"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Назад
          </Button>
        </div>
      </div>
    </div>
  );
}