# КРИТИЧЕСКИ ВАЖНО: Настройка переменных окружения на Timeweb

## Проблема
Когда код деплоится на Timeweb из GitHub, переменные из Replit Secrets **НЕ** передаются автоматически!

## Решение: Добавить переменные вручную в панели Timeweb

### Шаг 1: Зайдите в Timeweb Cloud Apps
https://timeweb.cloud/my/cloud-apps

### Шаг 2: Откройте ваше приложение
Найдите приложение `finesse22god-kavarabot-e967` и нажмите на него

### Шаг 3: Перейдите в "Переменные окружения" (Environment Variables)
В меню слева найдите раздел с переменными окружения

### Шаг 4: Добавьте ВСЕ эти переменные:

```
# КРИТИЧНЫЕ переменные - без них бот НЕ работает!
TELEGRAM_BOT_TOKEN=ваш_токен_бота
TELEGRAM_WEBHOOK_URL=https://finesse22god-kavarabot-e967.twc1.net/webhook
WEB_APP_URL=https://finesse22god-kavarabot-e967.twc1.net

# База данных
DATABASE_URL=postgresql://neon_user:password@host/database?sslmode=require

# Админ настройки
ADMIN_CHAT_ID=ваш_телеграм_id
ADMIN_TOKEN=ваш_секретный_админ_токен

# S3 хранилище (Timeweb)
S3_ACCESS_KEY=ваш_access_key
S3_SECRET_KEY=ваш_secret_key
S3_ENDPOINT=https://s3.twcstorage.ru
S3_BUCKET_NAME=355a4950-kavaraapp
S3_REGION=ru-1

# Оплата
YOOKASSA_SHOP_ID=ваш_shop_id
YOOKASSA_SECRET_KEY=ваш_secret_key
```

### Шаг 5: Перезапустите приложение на Timeweb
После добавления переменных нажмите "Перезапустить" или сделайте новый деплой

---

## Как проверить что всё работает:

1. Откройте логи приложения на Timeweb
2. Найдите строку: `✅ Telegram бот настроен успешно!`
3. Если видите эту строку - webhook установлен правильно
4. Если нет - значит переменные не установлены

---

## Почему это критично:

БЕЗ переменных окружения на Timeweb:
- ❌ Webhook НЕ установится при старте сервера
- ❌ Автопроверка каждые 5 минут НЕ работает  
- ❌ Бот перестанет отвечать через час когда сервер перезапустится

С переменными:
- ✅ Webhook устанавливается автоматически при каждом старте
- ✅ Проверка каждые 5 минут
- ✅ Автовосстановление при сбое
- ✅ Работает 24/7 без проблем
