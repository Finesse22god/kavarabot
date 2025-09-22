# PostgreSQL Database Setup

Этот каталог содержит Docker Compose конфигурацию для PostgreSQL базы данных.

## Структура

```
db/
├── docker-compose.yaml    # Docker Compose конфигурация
├── init/                  # Папка с инициализационными скриптами
│   └── 01-init.sql       # Базовый инициализационный скрипт
└── README.md             # Этот файл
```

## Запуск

1. Перейдите в папку `db/`:
   ```bash
   cd db
   ```

2. Запустите контейнер:
   ```bash
   docker-compose up -d
   ```

3. Проверьте статус:
   ```bash
   docker-compose ps
   ```

## Остановка

```bash
docker-compose down
```

## Подключение к базе данных

- **Хост**: localhost
- **Порт**: 5432
- **База данных**: kavara_bot
- **Пользователь**: kavara_user
- **Пароль**: kavara_password

### Пример подключения через psql:
```bash
psql -h localhost -p 5432 -U kavara_user -d kavara_bot
```

### Пример подключения через Docker:
```bash
docker exec -it kavara_postgres psql -U kavara_user -d kavara_bot
```

## Данные

Данные сохраняются в Docker volume `postgres_data`, который автоматически создается при первом запуске.

## Инициализационные скрипты

Все SQL файлы в папке `init/` выполняются при первом запуске контейнера в алфавитном порядке. Используйте их для:
- Создания таблиц
- Вставки начальных данных
- Настройки расширений

## Переменные окружения

Вы можете изменить настройки базы данных, отредактировав переменные в `docker-compose.yaml`:

- `POSTGRES_DB`: имя базы данных
- `POSTGRES_USER`: имя пользователя
- `POSTGRES_PASSWORD`: пароль 