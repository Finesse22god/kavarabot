
# API для интеграции с 1С

## 1. Импорт товаров из 1С в приложение

### Endpoint для загрузки товара
```
POST /api/1c/products
Authorization: Bearer {ADMIN_TOKEN}
Content-Type: application/json
```

### Параметры в теле запроса (JSON):

| Поле | Тип | Обязательно | Описание |
|------|-----|-------------|----------|
| `externalId` | string | Да | Уникальный идентификатор товара в 1С |
| `name` | string | Да | Название товара |
| `description` | string | Нет | Описание товара |
| `price` | number | Да | Цена товара (в рублях, целое число) |
| `imageUrl` | string | Нет | URL основного изображения товара |
| `images` | string[] | Нет | Массив URL дополнительных изображений |
| `category` | string | Нет | Категория товара |
| `brand` | string | Нет | Бренд товара |
| `color` | string | Нет | Цвет товара |
| `sizes` | string[] | Нет | Доступные размеры (например: ["XS", "S", "M", "L"]) |
| `sportTypes` | string[] | Нет | Виды спорта (например: ["Футбол", "Бег"]) |
| `isAvailable` | boolean | Нет | Доступность товара (по умолчанию true) |
| `inventory` | object | Нет | Остатки по размерам: `{"S": 5, "M": 10, "L": 3}` |

### Пример запроса:
```json
{
  "externalId": "00000001234",
  "name": "Футболка спортивная Nike Dri-FIT",
  "description": "Легкая дышащая футболка для тренировок",
  "price": 2990,
  "imageUrl": "https://example.com/images/nike-tshirt.jpg",
  "images": [
    "https://example.com/images/nike-tshirt-1.jpg",
    "https://example.com/images/nike-tshirt-2.jpg"
  ],
  "category": "Одежда",
  "brand": "Nike",
  "color": "Черный",
  "sizes": ["XS", "S", "M", "L", "XL"],
  "sportTypes": ["Бег", "Фитнес"],
  "isAvailable": true,
  "inventory": {
    "XS": 2,
    "S": 5,
    "M": 10,
    "L": 8,
    "XL": 3
  }
}
```

### Ответ при успехе (200 OK):
```json
{
  "id": "uuid-товара-в-бд",
  "externalId": "00000001234",
  "name": "Футболка спортивная Nike Dri-FIT",
  "price": 2990,
  "createdAt": "2024-01-15T10:30:00.000Z"
}
```

### Массовая загрузка товаров:
```
POST /api/1c/products/bulk
Authorization: Bearer {ADMIN_TOKEN}
Content-Type: application/json
```

Тело запроса - массив объектов товаров (формат как выше).

---

## 2. Экспорт заказов из приложения в 1С

### Endpoint для получения новых заказов
```
GET /api/1c/orders?status=pending&from={date}&to={date}
Authorization: Bearer {ADMIN_TOKEN}
```

### Параметры запроса (query string):

| Параметр | Тип | Обязательно | Описание |
|----------|-----|-------------|----------|
| `status` | string | Нет | Статус заказа (pending, paid, processing, shipped, delivered, cancelled) |
| `from` | string | Нет | Дата начала периода (ISO 8601: 2024-01-01T00:00:00Z) |
| `to` | string | Нет | Дата окончания периода |
| `limit` | number | Нет | Количество заказов (по умолчанию 100) |
| `offset` | number | Нет | Смещение для пагинации |

### Ответ (200 OK):
```json
{
  "total": 150,
  "orders": [
    {
      "id": "uuid-заказа",
      "orderNumber": "KB825925",
      "createdAt": "2024-01-15T10:30:00.000Z",
      "status": "paid",
      "customer": {
        "name": "Иванов Иван Иванович",
        "phone": "+79001234567",
        "email": "ivanov@example.com",
        "telegramId": "123456789",
        "telegramUsername": "ivanov_ivan"
      },
      "items": [
        {
          "type": "product",
          "productId": "uuid-товара",
          "externalId": "00000001234",
          "name": "Футболка спортивная Nike Dri-FIT",
          "selectedSize": "M",
          "quantity": 2,
          "price": 2990,
          "totalPrice": 5980
        },
        {
          "type": "box",
          "boxId": "uuid-бокса",
          "name": "Набор для бега Premium",
          "selectedSize": "L",
          "quantity": 1,
          "price": 15000,
          "totalPrice": 15000,
          "contents": [
            {
              "productId": "uuid-1",
              "externalId": "00000005678",
              "name": "Кроссовки для бега",
              "quantity": 1
            },
            {
              "productId": "uuid-2",
              "externalId": "00000005679",
              "name": "Компрессионные тайтсы",
              "quantity": 1
            }
          ]
        }
      ],
      "delivery": {
        "method": "delivery",
        "address": "г. Москва, ул. Ленина, д. 1, кв. 10"
      },
      "payment": {
        "method": "online",
        "paymentId": "2d3f7b8c-1234-5678-90ab-cdef12345678",
        "totalPrice": 20980,
        "discountAmount": 1000,
        "loyaltyPointsUsed": 500,
        "finalPrice": 19480
      },
      "promoCode": {
        "code": "SALE2024",
        "discountPercent": 5
      }
    }
  ]
}
```

### Endpoint для обновления статуса заказа
```
POST /api/1c/orders/{orderNumber}/status
Authorization: Bearer {ADMIN_TOKEN}
Content-Type: application/json
```

Тело запроса:
```json
{
  "status": "shipped",
  "trackingNumber": "1234567890"
}
```

Доступные статусы:
- `pending` - Ожидает обработки
- `paid` - Оплачен
- `processing` - В обработке
- `shipped` - Отправлен
- `delivered` - Доставлен
- `cancelled` - Отменен

---

## Аутентификация

Все запросы должны содержать заголовок авторизации:
```
Authorization: Bearer {ADMIN_TOKEN}
```

Токен можно получить через админ-панель приложения или по запросу.

---

## Обработка ошибок

### 400 Bad Request - Неверные параметры
```json
{
  "error": "Invalid request parameters",
  "details": "Field 'price' is required"
}
```

### 401 Unauthorized - Неверный токен
```json
{
  "error": "Unauthorized"
}
```

### 404 Not Found - Заказ не найден
```json
{
  "error": "Order not found"
}
```

### 500 Internal Server Error - Ошибка сервера
```json
{
  "error": "Internal server error"
}
```

---

## Webhooks (опционально)

Приложение может отправлять уведомления о новых заказах на URL в 1С:

```
POST {1C_WEBHOOK_URL}
Content-Type: application/json
```

Тело запроса содержит данные заказа в том же формате, что и GET /api/1c/orders.
