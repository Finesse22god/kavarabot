# Исправление 404 ошибки на маршрутах React Router (Timeweb)

## Проблема
Когда пользователь нажимает кнопки "Каталог" или "Готовые боксы" в Telegram, открывается страница 404.

**Причина**: Nginx на Timeweb не настроен для обработки React Router (SPA fallback).

## Решение

### Вариант 1: Настроить Nginx на Timeweb (Рекомендуется)

Добавьте следующую конфигурацию в Nginx на Timeweb сервере:

```nginx
server {
    listen 80;
    server_name finesse22god-kavarabot-e967.twc1.net;

    root /path/to/your/app/dist/public;
    index index.html;

    # Логирование
    access_log /var/log/nginx/kavara_access.log;
    error_log /var/log/nginx/kavara_error.log;

    # Обслуживание статических файлов
    location ~* \.(js|css|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot)$ {
        expires 1h;
        add_header Cache-Control "public, max-age=3600";
    }

    # API запросы проксируем на Node.js
    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Webhook для Telegram
    location /webhook {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Загруженные файлы
    location /uploads {
        proxy_pass http://localhost:5000;
    }

    # SPA FALLBACK - ВСЕ ОСТАЛЬНЫЕ ЗАПРОСЫ ВОЗВРАЩАЮТ index.html
    location / {
        try_files $uri $uri/ /index.html;
        add_header Cache-Control "no-cache, no-store, must-revalidate";
        add_header Pragma "no-cache";
        add_header Expires "0";
    }
}
```

**Ключевой момент**: Строка `try_files $uri $uri/ /index.html;` - это и есть SPA fallback!

### Вариант 2: Если нет доступа к Nginx

Если у вас нет доступа к настройке Nginx на Timeweb, убедитесь, что:

1. **Node.js сервер работает на порту 5000**
   ```bash
   pm2 logs kavara
   ```

2. **Nginx проксирует ВСЕ запросы на Node.js** (а не только `/api`)
   ```nginx
   location / {
       proxy_pass http://localhost:5000;
       # ... остальные proxy настройки
   }
   ```

3. **Node.js сервер обрабатывает SPA fallback** (уже настроено в `server/index.ts` строки 190-196)

## Проверка после настройки

1. Перезагрузите Nginx:
   ```bash
   sudo systemctl reload nginx
   ```

2. Проверьте, что страницы открываются:
   ```bash
   curl https://finesse22god-kavarabot-e967.twc1.net/catalog
   curl https://finesse22god-kavarabot-e967.twc1.net/boxes
   ```
   
   Оба запроса должны вернуть HTML с `<!DOCTYPE html>`

3. Откройте бота в Telegram, нажмите `/start`, затем кнопки "Каталог" и "Готовые боксы"

## Контакт с поддержкой Timeweb

Если нужна помощь с настройкой Nginx, обратитесь в поддержку Timeweb с этим запросом:

> "Добрый день! Мне нужно настроить SPA fallback для React приложения на сервере finesse22god-kavarabot-e967.twc1.net. 
> 
> Необходимо, чтобы:
> - Запросы к `/api/*` и `/webhook` проксировались на `http://localhost:5000`
> - Все остальные запросы (например, `/catalog`, `/boxes`) возвращали файл `/path/to/dist/public/index.html`
> 
> Можете ли вы добавить директиву `try_files $uri $uri/ /index.html;` в location `/` для этого домена?"

---

**После исправления Nginx проблема с 404 будет решена!** ✅
