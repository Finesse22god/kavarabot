
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { ArrowLeft } from "lucide-react";

export default function PrivacyPolicy() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-white pb-20">
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200 p-4">
        <div className="flex items-center space-x-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLocation("/")}
            className="text-black hover:bg-gray-100"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-xl font-bold">Политика конфиденциальности</h1>
        </div>
      </div>

      <div className="p-6 space-y-6">
        <section>
          <h2 className="text-lg font-semibold mb-3">1. Общие положения</h2>
          <p className="text-gray-700 leading-relaxed">
            Настоящая Политика конфиденциальности регулирует порядок обработки и использования персональных и иных данных пользователей Telegram-бота KAVARA (далее — «Бот»).
          </p>
          <p className="text-gray-700 leading-relaxed mt-2">
            Используя Бот, вы даете согласие на обработку данных в соответствии с настоящей Политикой.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-3">2. Какие данные мы собираем</h2>
          <ul className="list-disc list-inside space-y-2 text-gray-700">
            <li>Telegram ID, имя пользователя и имя из профиля Telegram</li>
            <li>Данные из опроса: рост, вес, размер одежды, спортивные предпочтения</li>
            <li>Контактные данные: телефон, email (при оформлении заказа)</li>
            <li>История заказов и покупок</li>
            <li>Избранные товары и боксы</li>
            <li>Баллы программы лояльности</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-3">3. Как мы используем данные</h2>
          <ul className="list-disc list-inside space-y-2 text-gray-700">
            <li>Персонализация подбора товаров и боксов</li>
            <li>Обработка и выполнение заказов</li>
            <li>Начисление и использование бонусных баллов</li>
            <li>Информирование о новых товарах и акциях</li>
            <li>Улучшение качества сервиса</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-3">4. Защита данных</h2>
          <p className="text-gray-700 leading-relaxed">
            Мы применяем технические и организационные меры для защиты ваших данных от несанкционированного доступа, изменения, раскрытия или уничтожения.
          </p>
          <p className="text-gray-700 leading-relaxed mt-2">
            Доступ к персональным данным имеют только уполномоченные сотрудники, которые обязаны соблюдать конфиденциальность.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-3">5. Передача данных третьим лицам</h2>
          <p className="text-gray-700 leading-relaxed">
            Мы не передаем ваши персональные данные третьим лицам, за исключением случаев:
          </p>
          <ul className="list-disc list-inside space-y-2 text-gray-700 mt-2">
            <li>Вы дали явное согласие на передачу</li>
            <li>Передача необходима для выполнения заказа (службы доставки)</li>
            <li>Передача требуется по закону</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-3">6. Ваши права</h2>
          <p className="text-gray-700 leading-relaxed">
            Вы имеете право:
          </p>
          <ul className="list-disc list-inside space-y-2 text-gray-700 mt-2">
            <li>Получать информацию о хранящихся данных</li>
            <li>Требовать исправления неточных данных</li>
            <li>Требовать удаления данных</li>
            <li>Отозвать согласие на обработку данных</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-3">7. Cookies и аналитика</h2>
          <p className="text-gray-700 leading-relaxed">
            Бот может использовать технологии отслеживания для улучшения пользовательского опыта и анализа использования сервиса.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-3">8. Изменение Политики</h2>
          <p className="text-gray-700 leading-relaxed">
            Мы оставляем за собой право изменять настоящую Политику. О существенных изменениях мы уведомим вас через Бот.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-3">9. Контакты</h2>
          <p className="text-gray-700 leading-relaxed">
            По вопросам, связанным с обработкой персональных данных, обращайтесь:
          </p>
          <p className="text-gray-700 leading-relaxed mt-2">
            Telegram: <a href="https://t.me/kavarabrand" className="text-blue-600 underline">@kavarabrand</a>
          </p>
        </section>

        <div className="pt-4 border-t border-gray-200">
          <p className="text-sm text-gray-500">
            Дата последнего обновления: {new Date().toLocaleDateString('ru-RU', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
      </div>
    </div>
  );
}
