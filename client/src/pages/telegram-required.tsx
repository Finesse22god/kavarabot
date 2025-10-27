import { Button } from "@/components/ui/button";
import { Send } from "lucide-react";

export default function TelegramRequired() {
  const botUsername = "kavaraappbot";
  const telegramLink = `https://t.me/${botUsername}`;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gradient-to-b from-background to-muted">
      <div className="max-w-md w-full text-center space-y-8">
        <div className="space-y-4">
          <h1 className="text-4xl font-bold tracking-tight">
            KAVARA
          </h1>
          <p className="text-lg text-muted-foreground">
            СПОРТИВНАЯ ОДЕЖДА
          </p>
        </div>

        <div className="bg-card border rounded-lg p-8 space-y-6 shadow-lg">
          <div className="space-y-3">
            <h2 className="text-2xl font-semibold">
              Откройте в Telegram
            </h2>
            <p className="text-muted-foreground">
              Для правильной работы приложения необходимо открыть его через Telegram Mini App
            </p>
          </div>

          <Button
            data-testid="button-open-telegram"
            size="lg"
            className="w-full"
            onClick={() => {
              window.location.href = telegramLink;
            }}
          >
            <Send className="mr-2 h-5 w-5" />
            Перейти в Telegram бот
          </Button>
        </div>

        <p className="text-sm text-muted-foreground">
          После перехода в бот нажмите кнопку "Открыть приложение" или команду /start
        </p>
      </div>
    </div>
  );
}
