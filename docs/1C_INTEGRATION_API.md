# API для интеграции с 1С

## Аутентификация

Все запросы к API должны содержать заголовок:
```
X-API-Key: your-secret-1c-api-key-here
```

## 1. Обновление остатков товаров

Метод позволяет обновлять информацию об остатках товаров и боксов в приложении.

### Endpoint
```
POST /api/1c/products/update-inventory
```

### Заголовки
```
Content-Type: application/json
X-API-Key: your-secret-1c-api-key-here
```

### Тело запроса (JSON)
```json
{
  "products": [
    {
      "externalId": "KAVARA-LV5K2F-XY9A",
      "inventory": {
        "S": 10,
        "M": 15,
        "L": 5,
        "XL": 0
      }
    },
    {
      "externalId": "KAVARA-LV5K2F-XY9A",
      "inventory": {
        "Стандарт": 20
      }
    }
  ]
}
```

### Поля запроса
- `products` (массив, обязательно) - список товаров для обновления
  - `externalId` (строка, обязательно) - внешний ID товара/бокса из 1С (используется для поиска и синхронизации)
  - `inventory` (объект, обязательно) - остатки по размерам
    - ключ: размер (S, M, L, XL и т.д.)
    - значение: количество (число)

**Примечание**: Каждый товар в приложении должен иметь уникальный `externalId`, который генерируется в админ-панели при создании товара или может быть задан вручную. Этот ID используется для синхронизации данных между приложением и 1С.

### Ответ
```json
{
  "success": true,
  "updated": 2,
  "failed": 0,
  "results": [
    {
      "externalId": "Футболка KAVARA Black",
      "productId": "uuid-here",
      "success": true,
      "inventory": {
        "S": 10,
        "M": 15,
        "L": 5,
        "XL": 0
      }
    }
  ]
}
```

---

## 2. Получение списка заказов

Получение списка оплаченных заказов для передачи в 1С.

### Endpoint
```
GET /api/1c/orders?status=paid&from=2024-01-01&to=2024-01-31&limit=100&offset=0
```

### Параметры запроса (Query)
- `status` (строка, опционально) - фильтр по статусу: `pending`, `paid`, `shipped`, `delivered`, `cancelled`
- `from` (дата ISO 8601, опционально) - дата начала периода (например: `2024-01-01T00:00:00Z`)
- `to` (дата ISO 8601, опционально) - дата окончания периода
- `limit` (число, опционально, по умолчанию: 100) - количество записей
- `offset` (число, опционально, по умолчанию: 0) - смещение для пагинации

### Ответ
```json
{
  "orders": [
    {
      "orderNumber": "KB825925",
      "createdAt": "2024-01-15T10:30:00.000Z",
      "status": "paid",
      "totalPrice": 4500,
      "customer": {
        "name": "Иван Иванов",
        "phone": "+79001234567",
        "email": "ivan@example.com",
        "telegramId": "123456789",
        "telegramUsername": "ivanov"
      },
      "items": [
        {
          "type": "product",
          "name": "Футболка KAVARA Black",
          "externalId": "KAVARA-LV5K2F-XY9A",
          "quantity": 1,
          "size": "M",
          "price": 5000
        }
      ],
      "delivery": {
        "method": "courier"
      },
      "payment": {
        "method": "card",
        "paymentId": "2d8a1e5c-000f-5000-a000-1e7e48b5e7b9",
        "paidAt": "2024-01-15T10:35:00.000Z"
      },
      "discount": {
        "promoCode": "TRAINER10",
        "discountPercent": 10,
        "discountAmount": 500,
        "loyaltyPointsUsed": 0
      }
    }
  ],
  "total": 150,
  "limit": 100,
  "offset": 0
}
```

### Поля ответа
- `orders` (массив) - список заказов
  - `orderNumber` (строка) - уникальный номер заказа
  - `createdAt` (дата) - дата создания заказа
  - `status` (строка) - статус заказа
  - `totalPrice` (число) - итоговая сумма заказа (после всех скидок)
  - `customer` (объект) - данные клиента
    - `name` (строка) - ФИО
    - `phone` (строка) - телефон
    - `email` (строка или null) - email
    - `telegramId` (строка или null) - ID в Telegram
    - `telegramUsername` (строка или null) - username в Telegram
  - `items` (массив) - список товаров в заказе
    - `type` (строка) - тип: "product" или "box"
    - `name` (строка) - название товара
    - `externalId` (строка или null) - внешний ID товара для синхронизации с 1С
    - `quantity` (число) - количество
    - `size` (строка или null) - выбранный размер
    - `price` (число) - цена за единицу
  - `delivery` (объект) - данные о доставке
    - `method` (строка) - способ доставки
  - `payment` (объект) - данные об оплате
    - `method` (строка) - способ оплаты
    - `paymentId` (строка или null) - ID платежа в платежной системе
    - `paidAt` (дата или null) - дата оплаты
  - `discount` (объект) - данные о скидках
    - `promoCode` (строка или null) - использованный промокод
    - `discountPercent` (число) - процент скидки
    - `discountAmount` (число) - сумма скидки
    - `loyaltyPointsUsed` (число) - использовано баллов лояльности
- `total` (число) - общее количество заказов (для пагинации)
- `limit` (число) - количество записей в текущей выборке
- `offset` (число) - смещение

---

## 3. Получение данных конкретного заказа

### Endpoint
```
GET /api/1c/orders/:orderNumber
```

### Пример
```
GET /api/1c/orders/KB825925
```

### Ответ
Аналогичен одному элементу из массива `orders` в методе получения списка заказов.

---

## 4. Обновление статуса заказа

Позволяет обновить статус заказа из 1С (например, когда товар отгружен).

### Endpoint
```
PUT /api/1c/orders/:orderNumber/status
```

### Тело запроса
```json
{
  "status": "shipped",
  "trackingNumber": "ABC123456"
}
```

### Поля запроса
- `status` (строка, обязательно) - новый статус: `pending`, `paid`, `shipped`, `delivered`, `cancelled`
- `trackingNumber` (строка, опционально) - трек-номер отправления

### Ответ
```json
{
  "success": true,
  "orderNumber": "KB825925",
  "status": "shipped"
}
```

---

## Статусы заказов

- `pending` - ожидает оплаты
- `paid` - оплачен
- `shipped` - отправлен
- `delivered` - доставлен
- `cancelled` - отменен

---

## Примеры использования

### Пример 1: Обновление остатков
```bash
curl -X POST https://your-app.replit.app/api/1c/products/update-inventory \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-secret-1c-api-key-here" \
  -d '{
    "products": [
      {
        "externalId": "Футболка KAVARA Black",
        "inventory": {"S": 10, "M": 15, "L": 5}
      }
    ]
  }'
```

### Пример 2: Получение оплаченных заказов за сегодня
```bash
curl -X GET "https://your-app.replit.app/api/1c/orders?status=paid&from=2024-01-15T00:00:00Z" \
  -H "X-API-Key: your-secret-1c-api-key-here"
```

### Пример 3: Обновление статуса заказа
```bash
curl -X PUT https://your-app.replit.app/api/1c/orders/KB825925/status \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-secret-1c-api-key-here" \
  -d '{"status": "shipped"}'
```

---

## Коды ошибок

- `401 Unauthorized` - неверный или отсутствующий API ключ
- `404 Not Found` - заказ или товар не найден
- `400 Bad Request` - неверный формат данных
- `500 Internal Server Error` - внутренняя ошибка сервера