# Настройка Timeweb Production Server

## КРИТИЧЕСКИ ВАЖНО: Environment Variables на Timeweb

После деплоя на Timeweb сервер **ОБЯЗАТЕЛЬНО** установите следующие переменные окружения:

### 1. Через панель управления Timeweb

Зайдите в настройки вашего проекта и добавьте:

```bash
TELEGRAM_WEBHOOK_URL=https://finesse22god-kavarabot-e967.twc1.net/webhook
WEB_APP_URL=https://finesse22god-kavarabot-e967.twc1.net
NODE_ENV=production
```

### 2. Или через SSH на сервере

Создайте файл `.env` в корне проекта:

```bash
# SSH подключение к Timeweb серверу
ssh your-username@finesse22god-kavarabot-e967.twc1.net

# Переход в директорию проекта
cd /path/to/your/project

# Создание .env файла
cat > .env << 'EOF'
TELEGRAM_WEBHOOK_URL=https://finesse22god-kavarabot-e967.twc1.net/webhook
WEB_APP_URL=https://finesse22god-kavarabot-e967.twc1.net
NODE_ENV=production

# Эти переменные уже должны быть установлены:
TELEGRAM_BOT_TOKEN=your_bot_token
DATABASE_URL=your_database_url
S3_ENDPOINT=https://s3.twcstorage.ru
S3_REGION=ru-1
S3_BUCKET_NAME=355a4950-kavaraapp
S3_ACCESS_KEY=your_key
S3_SECRET_KEY=your_secret
YOOKASSA_SECRET_KEY=your_yookassa_key
ADMIN_TOKEN=your_admin_token
EOF

# Перезапуск приложения
pm2 restart all
```

### 3. Настройка webhook после деплоя

После установки переменных окружения откройте в браузере:

```
https://finesse22god-kavarabot-e967.twc1.net/setup-bot
```

Вы должны увидеть:
```json
{
  "success": true,
  "message": "Bot setup completed",
  "webhook": {
    "ok": true,
    "result": true
  }
}
```

### 4. Проверка webhook

```bash
curl -s "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getWebhookInfo" | jq
```

Должно быть:
```json
{
  "url": "https://finesse22god-kavarabot-e967.twc1.net/webhook"
}
```

---

## Почему это важно?

Без этих переменных окружения:
- ❌ Webhook будет указывать на временный Replit URL
- ❌ Команды /start не будут работать
- ❌ Menu button будет открывать dev версию
- ❌ При каждом рестарте сервера webhook будет сбрасываться

С переменными окружения:
- ✅ Webhook ВСЕГДА на production URL
- ✅ Команды работают 24/7
- ✅ Menu button открывает production версию
- ✅ Рестарты сервера НЕ влияют на webhook
