import { useState } from "react";
import { HelpCircle, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export default function Info() {
  const [showSizeChart, setShowSizeChart] = useState(false);

  const faqData = [
    {
      question: "Как оформить заказ?",
      answer: "Выберите товар или бокс в каталоге, укажите размер, добавьте в корзину и перейдите к оформлению. Заполните данные для доставки и оплатите заказ онлайн."
    },
    {
      question: "Можно ли вернуть или обменять товар?",
      answer: "Да, у вас есть 14 дней для возврата или обмена товара в оригинальной упаковке и без следов использования."
    },
    {
      question: "Какие способы доставки доступны?",
      answer: "Мы предлагаем доставку курьером по Москве и доставку СДЭК по всей России."
    },
    {
      question: "Как подобрать размер одежды?",
      answer: "size_chart_link"
    },
    {
      question: "В какой срок поступят средства после возврата товара?",
      answer: "Возврат средств осуществляется в течение 10 дней с момента получения соответствующего запроса, оформленного по правилам интернет-магазина."
    }
  ];

  return (
    <div className="min-h-screen overflow-y-auto bg-black pb-40 font-jetbrains">
      <div className="p-4 bg-black text-white pt-safe">
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
                  {item.answer === "size_chart_link" ? (
                    <div>
                      <p className="mb-2">Измерьте свои параметры и сравните с нашей размерной сеткой для точного подбора.</p>
                      <button 
                        onClick={() => setShowSizeChart(true)}
                        className="text-primary underline font-medium"
                        data-testid="link-size-chart"
                      >
                        Открыть размерную сетку
                      </button>
                    </div>
                  ) : (
                    item.answer
                  )}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>

        <Dialog open={showSizeChart} onOpenChange={setShowSizeChart}>
          <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Размерная сетка</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Женская одежда</h4>
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="border p-2">Размер</th>
                      <th className="border p-2">Грудь</th>
                      <th className="border p-2">Талия</th>
                      <th className="border p-2">Бедра</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr><td className="border p-2 text-center">XS</td><td className="border p-2 text-center">82-86</td><td className="border p-2 text-center">62-66</td><td className="border p-2 text-center">88-92</td></tr>
                    <tr><td className="border p-2 text-center">S</td><td className="border p-2 text-center">86-90</td><td className="border p-2 text-center">66-70</td><td className="border p-2 text-center">92-96</td></tr>
                    <tr><td className="border p-2 text-center">M</td><td className="border p-2 text-center">90-94</td><td className="border p-2 text-center">70-74</td><td className="border p-2 text-center">96-100</td></tr>
                    <tr><td className="border p-2 text-center">L</td><td className="border p-2 text-center">94-98</td><td className="border p-2 text-center">74-78</td><td className="border p-2 text-center">100-104</td></tr>
                    <tr><td className="border p-2 text-center">XL</td><td className="border p-2 text-center">98-102</td><td className="border p-2 text-center">78-82</td><td className="border p-2 text-center">104-108</td></tr>
                  </tbody>
                </table>
              </div>
              
              <div>
                <h4 className="font-semibold mb-2">Мужская одежда</h4>
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="border p-2">Размер</th>
                      <th className="border p-2">Грудь</th>
                      <th className="border p-2">Талия</th>
                      <th className="border p-2">Бедра</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr><td className="border p-2 text-center">S</td><td className="border p-2 text-center">92-96</td><td className="border p-2 text-center">76-80</td><td className="border p-2 text-center">94-98</td></tr>
                    <tr><td className="border p-2 text-center">M</td><td className="border p-2 text-center">96-100</td><td className="border p-2 text-center">80-84</td><td className="border p-2 text-center">98-102</td></tr>
                    <tr><td className="border p-2 text-center">L</td><td className="border p-2 text-center">100-104</td><td className="border p-2 text-center">84-88</td><td className="border p-2 text-center">102-106</td></tr>
                    <tr><td className="border p-2 text-center">XL</td><td className="border p-2 text-center">104-108</td><td className="border p-2 text-center">88-92</td><td className="border p-2 text-center">106-110</td></tr>
                    <tr><td className="border p-2 text-center">XXL</td><td className="border p-2 text-center">108-112</td><td className="border p-2 text-center">92-96</td><td className="border p-2 text-center">110-114</td></tr>
                  </tbody>
                </table>
              </div>
              
              <p className="text-xs text-gray-500">* Размеры указаны в сантиметрах</p>
            </div>
          </DialogContent>
        </Dialog>

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
          <div className="flex items-center space-x-3 mb-4">
            <MessageCircle className="w-6 h-6 text-primary" />
            <h3 className="font-semibold">Telegram канал KAVARA</h3>
          </div>
          
          <div className="space-y-4">
            <p className="text-gray-600 text-sm">
              Новинки, акции и эксклюзивный контент о спортивной моде.
            </p>
            
            <Button 
              className="w-full bg-primary text-white"
              onClick={() => {
                if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
                  window.Telegram.WebApp.openTelegramLink("https://t.me/kavarasportswear");
                } else {
                  window.open("https://t.me/kavarasportswear", "_blank");
                }
              }}
              data-testid="button-subscribe-channel"
            >
              <MessageCircle className="w-4 h-4 mr-2" />
              Подписаться
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
