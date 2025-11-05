import { HelpCircle, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

export default function Info() {
  const faqData = [
    {
      question: "Как работает подбор боксов?",
      answer: "Наши стилисты анализируют ваши ответы в анкете о размерах, целях тренировок и бюджете, чтобы подобрать идеальный комплект спортивной одежды."
    },
    {
      question: "Можно ли вернуть или обменять товар?",
      answer: "Да, у вас есть 14 дней для возврата или обмена товара в оригинальной упаковке и без следов использования."
    },
    {
      question: "Какие способы доставки доступны?",
      answer: "Мы предлагаем доставку курьером по Москве (300₽), СДЭК по России (от 250₽) и самовывоз (бесплатно)."
    },
    {
      question: "Как часто выходят новые боксы?",
      answer: "Новые коллекции выходят ежемесячно. Подпишитесь на уведомления, чтобы не пропустить!"
    },
    {
      question: "Можно ли изменить состав бокса?",
      answer: "Готовые боксы имеют фиксированный состав, но вы можете пройти персональный опрос для индивидуального подбора."
    }
  ];

  return (
    <div className="min-h-screen overflow-y-auto bg-black pb-40">
      <div className="p-4 bg-black text-white">
        <div className="flex items-center space-x-3">
          <div className="text-2xl">ℹ️</div>
          <div>
            <h2 className="font-semibold">Информация</h2>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4">
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center space-x-3 mb-4">
            <HelpCircle className="w-6 h-6 text-primary" />
            <h3 className="font-semibold">Частые вопросы</h3>
          </div>
          
          <Accordion type="single" collapsible className="space-y-2">
            {faqData.map((item, index) => (
              <AccordionItem key={index} value={`item-${index}`}>
                <AccordionTrigger className="text-left">
                  {item.question}
                </AccordionTrigger>
                <AccordionContent className="text-gray-600">
                  {item.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center space-x-3 mb-4">
            <MessageCircle className="w-6 h-6 text-primary" />
            <h3 className="font-semibold">Связь с оператором</h3>
          </div>
          
          <div className="space-y-4">
            <p className="text-gray-600 text-sm">
              Наш менеджер поможет вам с любыми вопросами по заказам, размерам, доставке и возврату.
            </p>
            
            <Button 
              className="w-full bg-primary text-white"
              onClick={() => {
                if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
                  window.Telegram.WebApp.openTelegramLink("https://t.me/kavarabrand");
                } else {
                  window.open("https://t.me/kavarabrand", "_blank");
                }
              }}
              data-testid="button-contact-manager"
            >
              <MessageCircle className="w-4 h-4 mr-2" />
              Связаться с менеджером
            </Button>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h4 className="font-semibold mb-3">Telegram канал KAVARA</h4>
          <div className="space-y-3">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <MessageCircle className="w-6 h-6 text-blue-600" />
                  <div>
                    <p className="font-semibold text-blue-900">Подписаться на канал</p>
                    <p className="text-sm text-blue-700">Новинки, акции и эксклюзивный контент</p>
                  </div>
                </div>
                <Button 
                  onClick={() => {
                    if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
                      window.Telegram.WebApp.openTelegramLink("https://t.me/kavarabrand");
                    } else {
                      window.open("https://t.me/kavarabrand", "_blank");
                    }
                  }}
                  size="sm"
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                  data-testid="button-subscribe-channel"
                >
                  Подписаться
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
