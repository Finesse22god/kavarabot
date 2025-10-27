
import { Router } from "express";
import { AppDataSource } from "./database";
import { Product } from "./entities/Product";
import { Order } from "./entities/Order";
import { User } from "./entities/User";
import { Box } from "./entities/Box";

const router = Router();

// Middleware для проверки API ключа от 1С
const verify1CApiKey = (req: any, res: any, next: any) => {
  const apiKey = req.headers['x-api-key'];
  if (!apiKey || apiKey !== process.env.ONEС_API_KEY) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
};

/**
 * 1. ПОЛУЧЕНИЕ ДАННЫХ О ТОВАРАХ ИЗ 1С (обновление остатков)
 * 
 * POST /api/1c/products/update-inventory
 * 
 * Body (JSON):
 * {
 *   "products": [
 *     {
 *       "externalId": "товар-123",  // ID товара в 1С
 *       "inventory": {
 *         "S": 10,   // размер S - 10 шт
 *         "M": 15,   // размер M - 15 шт
 *         "L": 5     // размер L - 5 шт
 *       }
 *     }
 *   ]
 * }
 */
router.post("/api/1c/products/update-inventory", verify1CApiKey, async (req, res) => {
  try {
    const { products } = req.body;

    if (!Array.isArray(products)) {
      return res.status(400).json({ error: "products должен быть массивом" });
    }

    const productRepo = AppDataSource.getRepository(Product);
    const boxRepo = AppDataSource.getRepository(Box);
    const results = [];

    for (const item of products) {
      const { externalId, inventory } = item;

      if (!externalId || !inventory) {
        results.push({
          externalId,
          success: false,
          error: "Отсутствует externalId или inventory"
        });
        continue;
      }

      // Ищем товар по externalId
      const product = await productRepo.findOne({
        where: { externalId }
      });

      if (product) {
        product.inventory = inventory;
        await productRepo.save(product);
        results.push({
          externalId,
          productId: product.id,
          success: true,
          inventory
        });
      } else {
        // Если не нашли товар, проверяем боксы по externalId
        const box = await boxRepo.findOne({
          where: { externalId } as any
        });

        if (box) {
          box.inventory = inventory;
          await boxRepo.save(box);
          results.push({
            externalId,
            boxId: box.id,
            success: true,
            inventory
          });
        } else {
          results.push({
            externalId,
            success: false,
            error: "Товар или бокс не найден"
          });
        }
      }
    }

    res.json({
      success: true,
      updated: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
      results
    });
  } catch (error) {
    console.error("Error updating inventory from 1C:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * 2. ПОЛУЧЕНИЕ ДАННЫХ О ЗАКАЗАХ ДЛЯ ПЕРЕДАЧИ В 1С
 * 
 * GET /api/1c/orders?status=paid&from=2024-01-01&to=2024-01-31
 * 
 * Query параметры:
 * - status: фильтр по статусу (pending, paid, shipped, delivered, cancelled)
 * - from: дата начала (ISO 8601)
 * - to: дата окончания (ISO 8601)
 * - limit: количество записей (по умолчанию 100)
 * - offset: смещение для пагинации
 * 
 * Response:
 * {
 *   "orders": [
 *     {
 *       "orderNumber": "KB825925",
 *       "createdAt": "2024-01-15T10:30:00Z",
 *       "status": "paid",
 *       "totalPrice": 5000,
 *       "customer": {
 *         "name": "Иван Иванов",
 *         "phone": "+79001234567",
 *         "email": "ivan@example.com",
 *         "telegramId": "123456789"
 *       },
 *       "items": [
 *         {
 *           "type": "product",
 *           "name": "Футболка KAVARA",
 *           "externalId": "KAVARA-123-ABC",
 *           "quantity": 1,
 *           "size": "M",
 *           "price": 5000
 *         }
 *       ],
 *       "delivery": {
 *         "method": "courier",
 *         "address": "..."
 *       },
 *       "payment": {
 *         "method": "card",
 *         "paymentId": "abc123",
 *         "paidAt": "2024-01-15T10:35:00Z"
 *       },
 *       "discount": {
 *         "promoCode": "TRAINER10",
 *         "discountPercent": 10,
 *         "discountAmount": 500,
 *         "loyaltyPointsUsed": 100
 *       }
 *     }
 *   ],
 *   "total": 150,
 *   "limit": 100,
 *   "offset": 0
 * }
 */
router.get("/api/1c/orders", verify1CApiKey, async (req, res) => {
  try {
    const { 
      status, 
      from, 
      to, 
      limit = 100, 
      offset = 0 
    } = req.query;

    const orderRepo = AppDataSource.getRepository(Order);
    const queryBuilder = orderRepo.createQueryBuilder("order")
      .leftJoinAndSelect("order.user", "user")
      .leftJoinAndSelect("order.box", "box")
      .leftJoinAndSelect("order.product", "product")
      .leftJoinAndSelect("order.promoCode", "promoCode");

    // Фильтр по статусу
    if (status && typeof status === "string") {
      queryBuilder.andWhere("order.status = :status", { status });
    }

    // Фильтр по дате
    if (from && typeof from === "string") {
      queryBuilder.andWhere("order.createdAt >= :from", { from: new Date(from) });
    }
    if (to && typeof to === "string") {
      queryBuilder.andWhere("order.createdAt <= :to", { to: new Date(to) });
    }

    // Пагинация
    const limitNum = parseInt(limit as string);
    const offsetNum = parseInt(offset as string);
    queryBuilder.limit(limitNum).offset(offsetNum);

    // Сортировка
    queryBuilder.orderBy("order.createdAt", "DESC");

    // Получаем заказы и общее количество
    const [orders, total] = await queryBuilder.getManyAndCount();

    // Форматируем данные для 1С
    const formattedOrders = orders.map(order => {
      // Парсим товары из корзины если есть
      let items = [];
      if (order.cartItems) {
        try {
          const cartItems = JSON.parse(order.cartItems);
          items = cartItems.map((item: any) => ({
            type: item.type || "unknown",
            name: item.name,
            externalId: item.externalId || null,
            quantity: item.quantity || 1,
            size: item.selectedSize || null,
            price: item.price
          }));
        } catch (e) {
          console.error("Error parsing cart items:", e);
        }
      } else if (order.box) {
        items = [{
          type: "box",
          name: order.box.name,
          externalId: (order.box as any).externalId || null,
          quantity: 1,
          size: order.selectedSize || null,
          price: order.box.price
        }];
      } else if (order.product) {
        items = [{
          type: "product",
          name: order.product.name,
          externalId: order.product.externalId || null,
          quantity: 1,
          size: order.selectedSize || null,
          price: order.product.price
        }];
      }

      return {
        orderNumber: order.orderNumber,
        createdAt: order.createdAt,
        status: order.status,
        totalPrice: order.totalPrice,
        customer: {
          name: order.customerName,
          phone: order.customerPhone,
          email: order.customerEmail || null,
          telegramId: order.user?.telegramId || null,
          telegramUsername: order.user?.username || null
        },
        items,
        delivery: {
          method: order.deliveryMethod
        },
        payment: {
          method: order.paymentMethod,
          paymentId: order.paymentId || null,
          paidAt: order.status === "paid" ? order.createdAt : null
        },
        discount: {
          promoCode: order.promoCode?.code || null,
          discountPercent: order.discountPercent || 0,
          discountAmount: order.discountAmount || 0,
          loyaltyPointsUsed: order.loyaltyPointsUsed || 0
        }
      };
    });

    res.json({
      orders: formattedOrders,
      total,
      limit: limitNum,
      offset: offsetNum
    });
  } catch (error) {
    console.error("Error fetching orders for 1C:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * 3. ПОЛУЧЕНИЕ ДАННЫХ КОНКРЕТНОГО ЗАКАЗА
 * 
 * GET /api/1c/orders/:orderNumber
 */
router.get("/api/1c/orders/:orderNumber", verify1CApiKey, async (req, res) => {
  try {
    const { orderNumber } = req.params;

    const orderRepo = AppDataSource.getRepository(Order);
    const order = await orderRepo.findOne({
      where: { orderNumber },
      relations: ["user", "box", "product", "promoCode"]
    });

    if (!order) {
      return res.status(404).json({ error: "Заказ не найден" });
    }

    // Форматируем данные
    let items = [];
    if (order.cartItems) {
      try {
        const cartItems = JSON.parse(order.cartItems);
        items = cartItems.map((item: any) => ({
          type: item.type || "unknown",
          name: item.name,
          externalId: item.externalId || null,
          quantity: item.quantity || 1,
          size: item.selectedSize || null,
          price: item.price
        }));
      } catch (e) {
        console.error("Error parsing cart items:", e);
      }
    } else if (order.box) {
      items = [{
        type: "box",
        name: order.box.name,
        externalId: (order.box as any).externalId || null,
        quantity: 1,
        size: order.selectedSize || null,
        price: order.box.price
      }];
    } else if (order.product) {
      items = [{
        type: "product",
        name: order.product.name,
        externalId: order.product.externalId || null,
        quantity: 1,
        size: order.selectedSize || null,
        price: order.product.price
      }];
    }

    res.json({
      orderNumber: order.orderNumber,
      createdAt: order.createdAt,
      status: order.status,
      totalPrice: order.totalPrice,
      customer: {
        name: order.customerName,
        phone: order.customerPhone,
        email: order.customerEmail || null,
        telegramId: order.user?.telegramId || null,
        telegramUsername: order.user?.username || null
      },
      items,
      delivery: {
        method: order.deliveryMethod
      },
      payment: {
        method: order.paymentMethod,
        paymentId: order.paymentId || null,
        paidAt: order.status === "paid" ? order.createdAt : null
      },
      discount: {
        promoCode: order.promoCode?.code || null,
        discountPercent: order.discountPercent || 0,
        discountAmount: order.discountAmount || 0,
        loyaltyPointsUsed: order.loyaltyPointsUsed || 0
      }
    });
  } catch (error) {
    console.error("Error fetching order for 1C:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * 4. ОБНОВЛЕНИЕ СТАТУСА ЗАКАЗА ИЗ 1С
 * 
 * PUT /api/1c/orders/:orderNumber/status
 * 
 * Body:
 * {
 *   "status": "shipped",
 *   "trackingNumber": "ABC123456" (опционально)
 * }
 */
router.put("/api/1c/orders/:orderNumber/status", verify1CApiKey, async (req, res) => {
  try {
    const { orderNumber } = req.params;
    const { status, trackingNumber } = req.body;

    const orderRepo = AppDataSource.getRepository(Order);
    const order = await orderRepo.findOne({ where: { orderNumber } });

    if (!order) {
      return res.status(404).json({ error: "Заказ не найден" });
    }

    order.status = status;
    await orderRepo.save(order);

    res.json({
      success: true,
      orderNumber: order.orderNumber,
      status: order.status
    });
  } catch (error) {
    console.error("Error updating order status from 1C:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export function register1CRoutes(app: any) {
  app.use(router);
}
