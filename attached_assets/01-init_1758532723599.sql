-- Инициализационный скрипт для базы данных KavaraBot
-- Этот скрипт выполняется при первом запуске контейнера

-- Создание расширений (если нужны)
-- CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Создание базовых таблиц (пример)
-- CREATE TABLE IF NOT EXISTS users (
--     id SERIAL PRIMARY KEY,
--     telegram_id BIGINT UNIQUE NOT NULL,
--     username VARCHAR(255),
--     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
-- );

-- Вставка начальных данных (если нужны)
-- INSERT INTO users (telegram_id, username) VALUES (123456789, 'test_user');

-- Комментарий: раскомментируйте нужные строки по мере необходимости 