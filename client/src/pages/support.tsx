import { useState } from "react";
import { Phone, MessageCircle, RotateCcw, FileText, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

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

export default function Support() {
  const [feedbackForm, setFeedbackForm] = useState({
    type: "",
    message: ""
  });

  const handleFeedbackSubmit = () => {
    if (!feedbackForm.message.trim()) {
      alert('Пожалуйста, опишите ваше обращение');
      return;
    }
    
    if (!feedbackForm.type) {
      alert('Пожалуйста, выберите тип обращения');
      return;
    }
    
    // Send feedback to admin Telegram channel
    fetch('/api/send-feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: feedbackForm.type,
        message: feedbackForm.message,
        username: window.Telegram?.WebApp?.initDataUnsafe?.user?.username || 'Аноним'
      })
    }).then(() => {
      alert('Отзыв отправлен! Спасибо за обратную связь.');
      setFeedbackForm({ type: "", message: "" });
    }).catch(() => {
      // Fallback to Telegram manager
      if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
        window.Telegram.WebApp.openTelegramLink("https://t.me/kavarabrand");
      } else {
        window.open("https://t.me/kavarabrand", "_blank");
      }
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="p-4 bg-black text-white">
        <div className="flex items-center space-x-3">
          <div className="text-2xl">📞</div>
          <div>
            <h2 className="font-semibold">Поддержка</h2>
          </div>
        </div>
      </div>

      <div className="p-4">
        <Tabs defaultValue="faq" className="w-full">
          <TabsList className="grid w-full grid-cols-4 text-xs">
            <TabsTrigger value="faq">FAQ</TabsTrigger>
            <TabsTrigger value="contact">Связь</TabsTrigger>
            <TabsTrigger value="returns">Возврат</TabsTrigger>
            <TabsTrigger value="feedback">Отзывы</TabsTrigger>
          </TabsList>
          
          <TabsContent value="faq" className="mt-4">
            <div className="space-y-4">
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
            </div>
          </TabsContent>
          
          <TabsContent value="contact" className="mt-4">
            <div className="space-y-4">
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
                      >
                        Подписаться
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="returns" className="mt-4">
            <div className="space-y-4">
              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <RotateCcw className="w-6 h-6 text-primary" />
                  <h3 className="font-semibold">Возврат и обмен</h3>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">Условия возврата:</h4>
                    <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
                      <li>Срок: 14 дней с момента получения</li>
                      <li>Товар в оригинальной упаковке</li>
                      <li>Без следов использования</li>
                      <li>С сохранением всех ярлыков</li>
                    </ul>
                  </div>
                  
                  <div>
                    <h4 className="font-medium mb-2">Возврат денежных средств:</h4>
                    <p className="text-sm text-gray-600">
                      Деньги возвращаются на карту в течение 3-5 рабочих дней после получения товара.
                    </p>
                  </div>
                  
                  <div>
                    <h4 className="font-medium mb-2">Как оформить возврат:</h4>
                    <ol className="text-sm text-gray-600 space-y-1 list-decimal list-inside">
                      <li>Свяжитесь с нами любым удобным способом</li>
                      <li>Опишите причину возврата</li>
                      <li>Получите инструкции по отправке</li>
                      <li>Отправьте товар по указанному адресу</li>
                    </ol>
                  </div>
                  
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => {
                      if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
                        window.Telegram.WebApp.openTelegramLink("https://t.me/kavarabrand");
                      } else {
                        window.open("https://t.me/kavarabrand", "_blank");
                      }
                    }}
                  >
                    <MessageCircle className="w-4 h-4 mr-2" />
                    Связаться с менеджером
                  </Button>
                </div>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="feedback" className="mt-4">
            <div className="space-y-4">
              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <FileText className="w-6 h-6 text-primary" />
                  <h3 className="font-semibold">Жалобы и предложения</h3>
                </div>
                
                <div className="space-y-4">
                  <p className="text-gray-600 text-sm">
                    Ваше мнение важно для нас! Поделитесь своими впечатлениями, 
                    замечаниями или предложениями по улучшению сервиса.
                  </p>
                  
                  <div>
                    <Label htmlFor="feedback-type">Тип обращения</Label>
                    <select 
                      className="w-full p-3 border border-gray-300 rounded-lg"
                      value={feedbackForm.type}
                      onChange={(e) => setFeedbackForm(prev => ({ ...prev, type: e.target.value }))}
                    >
                      <option value="">Выберите тип</option>
                      <option value="complaint">Жалоба</option>
                      <option value="suggestion">Предложение</option>
                      <option value="praise">Благодарность</option>
                      <option value="other">Другое</option>
                    </select>
                  </div>
                  
                  <div>
                    <Label htmlFor="feedback-message">Ваше сообщение</Label>
                    <Textarea
                      id="feedback-message"
                      placeholder="Расскажите подробнее..."
                      value={feedbackForm.message}
                      onChange={(e) => setFeedbackForm(prev => ({ ...prev, message: e.target.value }))}
                      rows={4}
                    />
                  </div>
                  
                  <Button 
                    className="w-full bg-primary text-white"
                    onClick={handleFeedbackSubmit}
                  >
                    Отправить отзыв
                  </Button>
                </div>
              </div>
              
              <div className="bg-gradient-to-r from-orange-50 to-blue-50 rounded-xl p-6">
                <h4 className="font-semibold mb-2">Помогите нам стать лучше!</h4>
                <p className="text-sm text-gray-600 mb-4">
                  Оцените наш сервис и получите скидку 5% на следующий заказ.
                </p>
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => {
                    if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
                      window.Telegram.WebApp.openTelegramLink("https://t.me/kavarabrand");
                    } else {
                      window.open("https://t.me/kavarabrand", "_blank");
                    }
                  }}
                >
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Связаться с менеджером
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}