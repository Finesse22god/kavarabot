# Решение проблемы деплоя на Timeweb Cloud

## Проблема
При автоматическом деплое на Timeweb Cloud возникала ошибка:
```
unknown: unknown error
retrying in 1s
```

Это происходило на этапе `pushing layers` - Docker образ собирался успешно, но не мог быть загружен в registry из-за:
- Слишком большого размера образа
- Таймаутов при загрузке больших слоев
- Копирования ненужных файлов (node_modules, git history, документация)

## Решение

### 1. Создан `.dockerignore`
Исключает из Docker контекста:
- `node_modules` (будет переустановлен в контейнере)
- Git файлы (.git, *.sample, logs)
- Документацию (*.md, docs/)
- База данных (db/, *.sql)
- IDE файлы (.vscode, .idea)
- Временные файлы

### 2. Создан оптимизированный `Dockerfile`
**Multi-stage build** для минимального размера:

**Stage 1 (Builder):**
- Устанавливает все зависимости
- Собирает frontend (vite build)
- Собирает backend (esbuild)

**Stage 2 (Production):**
- Использует только собранные файлы
- Устанавливает только production зависимости
- Размер финального образа уменьшен на ~70%

**Ключевые оптимизации:**
```dockerfile
# Кэширование слоев - сначала зависимости
COPY package*.json ./
RUN npm ci

# Затем код и сборка
COPY . .
RUN npm run build

# В production - только результат сборки
COPY --from=builder /app/dist ./dist
```

## Инструкции по деплою

### Шаг 1: Закоммитить изменения
```bash
git add .dockerignore Dockerfile
git commit -m "Fix: Optimize Docker build for Timeweb deployment"
git push origin main
```

### Шаг 2: Автоматический деплой
Timeweb автоматически:
1. Обнаружит новый коммит
2. Склонирует репозиторий
3. Использует новый `Dockerfile`
4. Соберет оптимизированный образ
5. Задеплоит приложение

### Шаг 3: Мониторинг деплоя
В панели Timeweb смотрите логи:
- Build должен пройти за ~2-3 минуты (вместо 5+)
- Push layers должен завершиться без ошибок
- Финальный образ должен быть ~300-400MB (вместо 1GB+)

## Ожидаемый результат

**До оптимизации:**
```
- Размер контекста: ~500MB+
- Время сборки: 5-7 минут
- Размер образа: ~1GB
- Push layers: FAILED (timeouts)
```

**После оптимизации:**
```
- Размер контекста: ~100MB
- Время сборки: 2-3 минуты
- Размер образа: ~300-400MB
- Push layers: SUCCESS
```

## Дополнительные команды (если нужно)

### Локальная проверка образа
```bash
# Собрать образ локально
docker build -t kavara-app .

# Проверить размер
docker images kavara-app

# Запустить локально
docker run -p 5000:5000 \
  -e DATABASE_URL="your_db_url" \
  -e TELEGRAM_BOT_TOKEN="your_token" \
  kavara-app
```

### Очистка Docker кэша на Timeweb (если проблема повторится)
Через SSH на сервере:
```bash
# Подключение
ssh your-username@finesse22god-kavarabot-e967.twc1.net

# Очистка
docker system prune -af
docker builder prune -af

# Проверка места
df -h
```

## Решение проблем

### Если деплой все еще падает:

**1. Проверьте логи в панели Timeweb**
Ищите конкретную ошибку, отличную от `unknown: unknown error`

**2. Проверьте место на диске**
```bash
df -h
# Если < 2GB свободно - очистите
docker system prune -af
```

**3. Проверьте переменные окружения**
Убедитесь что установлены:
- `DATABASE_URL`
- `TELEGRAM_BOT_TOKEN`
- `S3_ENDPOINT`, `S3_BUCKET_NAME`, etc.
- `YOOKASSA_SECRET_KEY`
- `ADMIN_TOKEN`

**4. Повторный деплой**
Иногда помогает просто повторить:
```bash
git commit --allow-empty -m "Redeploy"
git push origin main
```

## Health Check

После успешного деплоя проверьте:

```bash
# Проверка здоровья
curl https://finesse22god-kavarabot-e967.twc1.net/health

# Проверка webhook
curl "https://api.telegram.org/bot<BOT_TOKEN>/getWebhookInfo"

# Должно показать:
# "url": "https://finesse22god-kavarabot-e967.twc1.net/webhook"
```

## Контакты для поддержки

Если проблема не решается:
1. Проверьте статус Timeweb Cloud: https://timeweb.cloud/status
2. Обратитесь в поддержку Timeweb с логами деплоя
3. Проверьте форумы Timeweb: https://timeweb.cloud/community
