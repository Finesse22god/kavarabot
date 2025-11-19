# Оптимизированный Dockerfile для Timeweb Cloud
# Multi-stage build для минимального размера образа

# Stage 1: Build stage
FROM node:22-slim AS builder

# Установка системных зависимостей для сборки
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Копируем только файлы зависимостей для кэширования слоя
COPY package*.json ./

# Устанавливаем ВСЕ зависимости (включая devDependencies для сборки)
RUN npm ci

# Копируем исходный код
COPY . .

# Собираем приложение
RUN npm run build

# Stage 2: Production stage (минимальный образ)
FROM node:22-slim AS production

# Устанавливаем только runtime зависимости
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Создаем пользователя для безопасности
RUN groupadd --gid 2000 app && \
    useradd --uid 2000 --gid 2000 -m -s /bin/bash app

# Устанавливаем PM2 глобально
RUN npm install -g pm2

WORKDIR /app

# Копируем только package.json для production зависимостей
COPY package*.json ./

# Устанавливаем ТОЛЬКО production зависимости
RUN npm ci --only=production && npm cache clean --force

# Копируем собранное приложение из builder stage
COPY --from=builder --chown=app:app /app/dist ./dist

# Копируем статические ассеты (если они нужны для рантайма)
# Они уже включены в dist/public после vite build
# COPY --from=builder --chown=app:app /app/attached_assets ./attached_assets

# Переключаемся на непривилегированного пользователя
USER app

# Открываем порт
EXPOSE 5000

# Переменные окружения
ENV NODE_ENV=production
ENV PORT=5000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD curl -f http://localhost:5000/health || exit 1

# Запуск с PM2
CMD ["pm2-runtime", "start", "dist/index.js", "--name", "kavara-app", "-i", "2"]
