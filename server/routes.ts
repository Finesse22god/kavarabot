import { Router } from "express";
import multer from "multer";
import path from "path";
import { promises as fs } from "fs";
import { fileTypeFromFile, fileTypeFromBuffer } from "file-type";
import * as XLSX from "xlsx";
import { AppDataSource } from "./database";
import { storage } from "./storage";
import { notifyAdminAboutNewOrder } from "./telegram";
import { parseKavaraCatalog } from "./parser";
import {
  createPaymentIntent,
  checkPaymentStatus,
  parseYooKassaNotification,
  verifyNotification
} from "./payment";
import { createAdminToken, verifyToken } from "./auth";
import { uploadToS3 } from "./s3";
import { User as UserEntity } from "./entities/User";
import { Order as OrderEntity } from "./entities/Order";
import { LoyaltyTransaction as LoyaltyTransactionEntity } from "./entities/LoyaltyTransaction";
import { PromoCode as PromoCodeEntity } from "./entities/PromoCode";
import { PromoCodeUsage as PromoCodeUsageEntity } from "./entities/PromoCodeUsage";
import { Trainer as TrainerEntity } from "./entities/Trainer";
import { InventoryHistory } from "./entities/InventoryHistory";
import { Cart as CartEntity } from "./entities/Cart";
import { adjustInventory } from "./inventory-helpers";
import type {
  User,
  QuizResponse,
  Box,
  Order,
  Notification,
  LoyaltyTransaction,
  Referral,
  CreateUserDto,
  CreateQuizResponseDto,
  CreateBoxDto,
  CreateOrderDto,
  CreateNotificationDto,
  CreateLoyaltyTransactionDto,
  CreateReferralDto,
  CreateProductDto
} from "@shared/types";

const router = Router();

// Configure multer for S3 uploads (use memory storage)
const upload = multer({
  storage: multer.memoryStorage(), // Храним файлы в памяти для загрузки в S3
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Недопустимый тип файла. Разрешены: JPG, PNG, WebP, GIF"));
    }
  },
});

// Multer configuration for product images (same as boxes, uses S3)
const productUpload = multer({
  storage: multer.memoryStorage(), // Храним файлы в памяти для загрузки в S3
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Недопустимый тип файла. Разрешены: JPG, PNG, WebP, GIF"));
    }
  },
});

// File upload endpoint for boxes (uploads to S3)
router.post("/api/upload/box-image", upload.single("image"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "Файл не загружен" });
    }

    // Проверяем реальный тип файла из буфера (безопасность)
    const fileType = await fileTypeFromBuffer(req.file.buffer);
    const allowedMimeTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    
    if (!fileType || !allowedMimeTypes.includes(fileType.mime)) {
      return res.status(400).json({ 
        error: "Недопустимый тип файла. Разрешены только изображения: JPG, PNG, WebP, GIF" 
      });
    }

    // Загружаем в S3
    const s3Url = await uploadToS3(req.file, "boxes");
    
    res.json({ url: s3Url });
  } catch (error) {
    console.error("Error uploading file to S3:", error);
    res.status(500).json({ error: "Ошибка при загрузке файла" });
  }
});

// File upload endpoint for products (uploads to S3)
router.post("/api/upload/product-image", productUpload.single("image"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "Файл не загружен" });
    }

    // Проверяем реальный тип файла из буфера (безопасность)
    const fileType = await fileTypeFromBuffer(req.file.buffer);
    const allowedMimeTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    
    if (!fileType || !allowedMimeTypes.includes(fileType.mime)) {
      return res.status(400).json({ 
        error: "Недопустимый тип файла. Разрешены только изображения: JPG, PNG, WebP, GIF" 
      });
    }

    // Загружаем в S3
    const s3Url = await uploadToS3(req.file, "products");
    
    res.json({ url: s3Url });
  } catch (error) {
    console.error("Error uploading file to S3:", error);
    res.status(500).json({ error: "Ошибка при загрузке файла" });
  }
});

// Update user profile data
router.put("/api/users/:id", async (req, res) => {
  try {
    const { firstName, lastName, username } = req.body;
    const user = await storage.getUser(req.params.id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Update user data
    const updatedUser = await storage.updateUser(req.params.id, {
      firstName: firstName || user.firstName,
      lastName: lastName || user.lastName,
      username: username || user.username
    });

    if (!updatedUser) {
      return res.status(500).json({ error: "Failed to update user" });
    }

    res.json(updatedUser);
  } catch (error) {
    console.error("Error updating user:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Users
router.get("/api/users/:id", async (req, res) => {
  try {
    const user = await storage.getUser(req.params.id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    res.json(user);
  } catch (error) {
    console.error("Error fetching user:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/api/users/telegram/:telegramId", async (req, res) => {
  try {
    const user = await storage.getUserByTelegramId(req.params.telegramId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    res.json(user);
  } catch (error) {
    console.error("Error fetching user by telegram ID:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/api/users", async (req, res) => {
  try {
    const { telegramId, username, firstName, lastName, referralCode } = req.body;

    // Check if user already exists
    if (telegramId) {
      const existingUser = await storage.getUserByTelegramId(telegramId);
      if (existingUser) {
        return res.json(existingUser);
      }
    }

    // Create new user
    const user = await storage.createUser({
      telegramId,
      username,
      firstName,
      lastName,
    });

    // Handle referral if provided
    if (referralCode) {
      try {
        const referrer = await storage.getUserByReferralCode(referralCode);
        if (referrer) {
          // Create referral record
          await storage.createReferral({
            referrerId: referrer.id,
            referredId: user.id,
            status: 'pending'
          });

          // Give welcome bonus to new user
          const welcomePoints = 250;
          await storage.createLoyaltyTransaction({
            userId: user.id,
            type: 'referral_reward',
            points: welcomePoints,
            description: `Приветственный бонус за регистрацию по реферальной ссылке`
          });
          await storage.updateUserLoyaltyPoints(user.id, welcomePoints);

          console.log(`New user ${user.id} joined via referral code ${referralCode} from user ${referrer.id}`);
        }
      } catch (error) {
        console.error("Error processing referral:", error);
        // Don't fail user creation if referral processing fails
      }
    }

    res.status(201).json(user);
  } catch (error) {
    console.error("Error creating user:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Quiz Responses
router.get("/api/quiz-responses/:userId", async (req, res) => {
  try {
    const response = await storage.getQuizResponse(req.params.userId);
    if (!response) {
      return res.status(404).json({ error: "Quiz response not found" });
    }
    res.json(response);
  } catch (error) {
    console.error("Error fetching quiz response:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/api/quiz-responses/user/:userId", async (req, res) => {
  try {
    // Check if userId is telegramId (numeric) or UUID
    let response;
    if (/^\d+$/.test(req.params.userId)) {
      response = await storage.getQuizResponseByTelegramId(req.params.userId);
    } else {
      response = await storage.getQuizResponse(req.params.userId);
    }

    if (!response) {
      return res.status(404).json({ error: "Quiz response not found" });
    }
    res.json(response);
  } catch (error) {
    console.error("Error fetching quiz response:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/api/quiz-responses", async (req, res) => {
  try {
    const responseData: CreateQuizResponseDto = req.body;
    const response = await storage.createQuizResponse(responseData);
    res.status(201).json(response);
  } catch (error) {
    console.error("Error creating quiz response:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.put("/api/quiz-responses/:userId", async (req, res) => {
  try {
    const updateData: Partial<CreateQuizResponseDto> = req.body;
    const response = await storage.updateQuizResponse(req.params.userId, updateData);
    if (!response) {
      return res.status(404).json({ error: "Quiz response not found" });
    }
    res.json(response);
  } catch (error) {
    console.error("Error updating quiz response:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.put("/api/quiz-responses/user/:userId", async (req, res) => {
  try {
    const updateData: Partial<CreateQuizResponseDto> = req.body;
    const response = await storage.updateQuizResponse(req.params.userId, updateData);
    if (!response) {
      return res.status(404).json({ error: "Quiz response not found" });
    }
    res.json(response);
  } catch (error) {
    console.error("Error updating quiz response:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Boxes
router.get("/api/boxes", async (req, res) => {
  try {
    const { category, userId } = req.query;
    let boxes: Box[];

    if (category && typeof category === "string") {
      // Если запрашиваются персональные боксы с userId, применяем фильтрацию
      if (category === "personal" && userId && typeof userId === "string") {
        try {
          // Получаем ответы квиза пользователя
          let quizResponse;
          if (/^\d+$/.test(userId)) {
            quizResponse = await storage.getQuizResponseByTelegramId(userId);
          } else {
            quizResponse = await storage.getQuizResponse(userId);
          }

          if (quizResponse) {
            console.log(`\n🔍 НАЙДЕН КВИЗ ДЛЯ ПОЛЬЗОВАТЕЛЯ: ${userId}`);
            console.log(`Ответы квиза:`, JSON.stringify(quizResponse, null, 2));

            // Получаем ВСЕ боксы и фильтруем только квизовые (isQuizOnly=true)
            const allBoxes = await storage.getAllBoxes();
            const quizOnlyBoxes = allBoxes.filter(box => box.isQuizOnly === true);
            console.log(`\n📦 ВСЕГО КВИЗОВЫХ БОКСОВ: ${quizOnlyBoxes.length}`);

            // Применяем фильтрацию по видам спорта и бюджету
            const filteredBoxes = quizOnlyBoxes.filter(box => {
              // Фильтр по видам спорта
              const hasMatchingSport = box.sportTypes && box.sportTypes.some(sportType =>
                quizResponse.goals && quizResponse.goals.includes(sportType)
              );

              // Фильтр по бюджету
              const budgetValue = quizResponse.budget;
              let isWithinBudget = true;

              if (budgetValue) {
                if (budgetValue === "10000") {
                  // "До 10к" - цена <= 10000
                  isWithinBudget = box.price <= 10000;
                } else if (budgetValue === "15000") {
                  // "10-15к" - цена <= 15000 (включая товары дешевле 10к)
                  isWithinBudget = box.price <= 15000;
                } else if (budgetValue === "20000") {
                  // "15-20к" - цена от 15001 до 20000
                  isWithinBudget = box.price > 15000 && box.price <= 20000;
                } else if (budgetValue === "20000+") {
                  // "Больше 20к" - цена > 20000
                  isWithinBudget = box.price > 20000;
                }
              }

              // Детальная отладка
              console.log(`\n=== Фильтрация бокса: ${box.name} ===`);
              console.log(`Цена: ${box.price}`);
              console.log(`Виды спорта в боксе: ${JSON.stringify(box.sportTypes)}`);
              console.log(`Цели пользователя: ${JSON.stringify(quizResponse.goals)}`);
              console.log(`Бюджет пользователя: ${budgetValue}`);
              console.log(`Совпадает спорт: ${hasMatchingSport}`);
              console.log(`В бюджете: ${isWithinBudget}`);
              console.log(`Итоговый результат: ${hasMatchingSport && isWithinBudget}`);

              return hasMatchingSport && isWithinBudget;
            });

            console.log(`\n✅ РЕЗУЛЬТАТ ФИЛЬТРАЦИИ: ${filteredBoxes.length} боксов`);
            filteredBoxes.forEach(box => {
              console.log(`   - ${box.name}: ${box.price}₽, спорт: ${JSON.stringify(box.sportTypes)}`);
            });

            // Добавляем продукты к персональным боксам
            boxes = filteredBoxes;
          } else {
            console.log(`\n❌ КВИЗ НЕ НАЙДЕН для пользователя: ${userId}`);
            // Если нет данных квиза, не показываем квизовые боксы
            boxes = [];
          }
        } catch (error) {
          console.error("Error applying personalization filters:", error);
          // Fallback: не показываем квизовые боксы без данных квиза
          boxes = [];
        }
      } else {
        // Обычный запрос по категории - исключаем квизовые боксы
        const categoryBoxes = await storage.getBoxesByCategory(category);
        boxes = categoryBoxes.filter(box => !box.isQuizOnly);
      }
    } else {
      // Запрос всех боксов - исключаем квизовые
      const allBoxes = await storage.getAllBoxes();
      boxes = allBoxes.filter(box => !box.isQuizOnly);
    }

    // Добавляем продукты к каждому боксу
    const boxesWithProducts = await Promise.all(
      boxes.map(async (box) => {
        const boxProducts = await storage.getBoxProducts(box.id);
        return {
          ...box,
          products: boxProducts.map(bp => ({
            ...bp.product,
            quantity: bp.quantity
          }))
        };
      })
    );

    res.json(boxesWithProducts);
  } catch (error) {
    console.error("Error fetching boxes:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/api/boxes/:id", async (req, res) => {
  try {
    const box = await storage.getBox(req.params.id);
    if (!box) {
      return res.status(404).json({ error: "Box not found" });
    }
    res.json(box);
  } catch (error) {
    console.error("Error fetching box:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/api/boxes", async (req, res) => {
  try {
    const boxData: CreateBoxDto = req.body;
    const box = await storage.createBox(boxData);
    res.status(201).json(box);
  } catch (error) {
    console.error("Error creating box:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.put("/api/boxes/:id/price", async (req, res) => {
  try {
    const { price } = req.body;

    if (!price || typeof price !== 'number' || price <= 0) {
      return res.status(400).json({ error: "Valid price is required" });
    }

    const updatedBox = await storage.updateBoxPrice(req.params.id, price);

    if (!updatedBox) {
      return res.status(404).json({ error: "Box not found" });
    }

    res.json(updatedBox);
  } catch (error) {
    console.error("Error updating box price:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Orders
router.get("/api/orders/:id", async (req, res) => {
  try {
    const order = await storage.getOrder(req.params.id);
    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }
    res.json(order);
  } catch (error) {
    console.error("Error fetching order:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/api/orders/user/:userId", async (req, res) => {
  try {
    // The storage method now handles both telegramId and UUID automatically
    const orders = await storage.getOrdersByUser(req.params.userId);
    res.json(orders);
  } catch (error) {
    console.error("Error fetching user orders:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/api/orders/number/:orderNumber", async (req, res) => {
  try {
    const order = await storage.getOrderByNumber(req.params.orderNumber);
    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }
    res.json(order);
  } catch (error) {
    console.error("Error fetching order by number:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/api/orders/update-status", verifyAdminToken, async (req, res) => {
  try {
    const { orderNumber, status } = req.body;
    const order = await storage.updateOrderStatus(orderNumber, status);
    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }
    res.json(order);
  } catch (error) {
    console.error("Error updating order status:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.put("/api/orders/:orderId/payment-id", async (req, res) => {
  try {
    const { orderId } = req.params;
    const { paymentId } = req.body;
    const order = await storage.updateOrderPaymentId(orderId, paymentId);
    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }
    res.json(order);
  } catch (error) {
    console.error("Error updating order payment ID:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// YooKassa webhook endpoint for payment notifications
router.post("/api/yoomoney-webhook", async (req, res) => {
  try {
    console.log("=== YOOKASSA WEBHOOK RECEIVED ===");
    console.log("Headers:", JSON.stringify(req.headers, null, 2));
    console.log("Body:", JSON.stringify(req.body, null, 2));
    console.log("================================");
    
    const { event, object } = req.body;
    
    // Handle payment.succeeded event
    if (event === "payment.succeeded" && object) {
      const paymentId = object.id;
      const orderNumber = object.metadata?.orderId;  // This is actually the order NUMBER (e.g. "KB825925")
      
      console.log(`Received payment success notification for payment ID: ${paymentId}, order number: ${orderNumber}`);
      
      if (orderNumber) {
        // Find order by order number from metadata and update status
        const order = await storage.updateOrderStatus(orderNumber, "paid");
        
        if (order) {
          console.log(`Order ${order.orderNumber} marked as paid via YooKassa webhook`);
          
          // Also save the payment ID to the order
          await storage.updateOrderPaymentId(order.id, paymentId);
          
          // Update status in RetailCRM (async, non-blocking)
          updateOrderStatusInRetailCRMSafe(order.orderNumber, "paid");
          
          // Award promo code owner points ONLY after successful payment
          if (order.promoCodeId && order.userId) {
            try {
              const PromoCodeRepo = AppDataSource.getRepository(PromoCodeEntity);
              const PromoCodeUsageRepo = AppDataSource.getRepository(PromoCodeUsageEntity);
              const UserRepo = AppDataSource.getRepository(UserEntity);
              const LoyaltyRepo = AppDataSource.getRepository(LoyaltyTransactionEntity);
              
              // Check if usage already recorded (idempotency)
              const existingUsage = await PromoCodeUsageRepo.findOne({
                where: { orderId: order.id }
              });
              
              if (!existingUsage) {
                // Load promo code with owner relation
                const promoCode = await PromoCodeRepo.findOne({
                  where: { id: order.promoCodeId },
                  relations: ['owner']
                });
                
                // Calculate points to award based on reward type
                let pointsToAward = 0;
                if (promoCode && promoCode.owner) {
                  if (promoCode.rewardPercent && promoCode.rewardPercent > 0) {
                    // Calculate points as percentage of order total price
                    pointsToAward = Math.floor(order.totalPrice * (promoCode.rewardPercent / 100));
                  } else if (promoCode.pointsPerUse > 0) {
                    // Use fixed points per use
                    pointsToAward = promoCode.pointsPerUse;
                  }
                }
                
                if (promoCode && promoCode.owner && pointsToAward > 0) {
                  console.log(`Awarding ${pointsToAward} points to promo code owner for order ${order.orderNumber}`);
                  
                  // Create usage record (unique constraint on orderId prevents duplicates)
                  const usage = PromoCodeUsageRepo.create({
                    promoCodeId: promoCode.id,
                    userId: order.userId,
                    orderId: order.id,
                    orderAmount: order.totalPrice,
                    discountAmount: order.discountAmount || 0,
                    pointsAwarded: pointsToAward
                  });
                  await PromoCodeUsageRepo.save(usage);
                  
                  // Award points to owner
                  const ownerUser = await UserRepo.findOne({
                    where: { id: promoCode.owner.id }
                  });
                  
                  if (ownerUser) {
                    ownerUser.loyaltyPoints = (ownerUser.loyaltyPoints || 0) + pointsToAward;
                    await UserRepo.save(ownerUser);
                    
                    // Create loyalty transaction for tracking
                    const loyaltyTransaction = LoyaltyRepo.create({
                      userId: ownerUser.id,
                      orderId: order.id,
                      type: 'earn',
                      points: pointsToAward,
                      description: `Начислено за использование промокода ${promoCode.code}`
                    });
                    await LoyaltyRepo.save(loyaltyTransaction);
                    
                    console.log(`Successfully awarded ${pointsToAward} points to owner ${ownerUser.telegramId}`);
                  }
                }
              } else {
                console.log(`Promo code usage already recorded for order ${order.orderNumber} (idempotency check)`);
              }
            } catch (error: any) {
              // Handle unique constraint violation gracefully (duplicate webhook)
              if (error.code === '23505' || error.message?.includes('duplicate')) {
                console.log(`Promo code usage already recorded for order ${order.orderNumber} (duplicate webhook - unique constraint)`);
              } else {
                console.error(`Error awarding promo code owner points for order ${order.orderNumber}:`, error);
              }
            }
          }
          
          // Load full order with relations to get product/box details
          const fullOrder = await AppDataSource.getRepository(OrderEntity).findOne({
            where: { id: order.id },
            relations: ['box', 'product']
          });
          
          // Get user data to include telegram username
          let telegramUsername = '';
          if (order.userId) {
            const user = await storage.getUser(order.userId);
            if (user?.username) {
              telegramUsername = `@${user.username}`;
            }
          }
          
          // Build items list with sizes
          let itemsList = '\n🛍️ <b>Товары:</b>\n';
          
          // Check cartItems FIRST - cart orders have multiple items
          if (fullOrder?.cartItems) {
            // Cart order with multiple items
            try {
              const cartItems = JSON.parse(fullOrder.cartItems);
              for (const item of cartItems) {
                // Get item name from nested product/box object or direct name
                const itemName = item.itemType === 'product' 
                  ? (item.product?.name || item.name || 'Товар')
                  : item.itemType === 'box'
                  ? (item.box?.name || item.name || 'Бокс')
                  : (item.name || 'Товар');
                
                itemsList += `• ${itemName}`;
                
                // Handle size - can be string or object for boxes
                if (item.selectedSize) {
                  try {
                    const sizeData = typeof item.selectedSize === 'string' 
                      ? JSON.parse(item.selectedSize) 
                      : item.selectedSize;
                    if (sizeData && typeof sizeData === 'object' && (sizeData.top || sizeData.bottom)) {
                      itemsList += ` (Верх: ${sizeData.top || '-'}, Низ: ${sizeData.bottom || '-'})`;
                    } else {
                      itemsList += ` (Размер: ${item.selectedSize})`;
                    }
                  } catch {
                    itemsList += ` (Размер: ${item.selectedSize})`;
                  }
                }
                
                if (item.quantity && item.quantity > 1) {
                  itemsList += ` x${item.quantity}`;
                }
                itemsList += '\n';
              }
            } catch (e) {
              itemsList += '• Детали товаров недоступны\n';
            }
          } else if (fullOrder?.boxId && fullOrder.box) {
            // Single box order (no cart)
            itemsList += `• ${fullOrder.box.name}`;
            if (fullOrder.selectedSize) {
              itemsList += ` (Размер: ${fullOrder.selectedSize})`;
            }
            itemsList += '\n';
          } else if (fullOrder?.productId && fullOrder.product) {
            // Single product order (no cart)
            itemsList += `• ${fullOrder.product.name}`;
            if (fullOrder.selectedSize) {
              itemsList += ` (Размер: ${fullOrder.selectedSize})`;
            }
            itemsList += '\n';
          }
          
          // Build comprehensive admin notification with all order details
          const adminNotification = `💰 <b>Новая оплата через ЮKassa!</b>

📦 <b>Заказ №:</b> ${order.orderNumber}
👤 <b>Клиент:</b> ${order.customerName}
${telegramUsername ? `👨‍💻 <b>Telegram:</b> ${telegramUsername}\n` : ''}📱 <b>Телефон:</b> ${order.customerPhone}
${order.customerEmail ? `📧 <b>Email:</b> ${order.customerEmail}\n` : ''}${itemsList}
🚚 <b>Доставка:</b> ${order.deliveryMethod}
💳 <b>Оплата:</b> ${order.paymentMethod}
💰 <b>Сумма:</b> ${order.totalPrice}₽

💳 <b>ID платежа:</b> ${paymentId}

📅 <b>Дата:</b> ${new Date(order.createdAt).toLocaleString('ru-RU')}`;

          const ADMIN_CHAT_ID = process.env.ADMIN_CHAT_ID || '-1002812810825';
          const ORDERS_CHANNEL_ID = process.env.ORDERS_CHANNEL_ID;

          // Send notification to admin chat with HTML formatting
          if (ADMIN_CHAT_ID) {
            try {
              await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  chat_id: ADMIN_CHAT_ID,
                  text: adminNotification,
                  parse_mode: 'HTML'
                })
              });
              console.log('Payment notification sent to admin chat');
            } catch (error) {
              console.error('Failed to send payment notification to admin:', error);
            }
          }

          // Send notification to orders channel if configured
          if (ORDERS_CHANNEL_ID) {
            try {
              await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  chat_id: ORDERS_CHANNEL_ID,
                  text: adminNotification,
                  parse_mode: 'HTML'
                })
              });
              console.log('Payment notification sent to orders channel');
            } catch (error) {
              console.error('Failed to send payment notification to channel:', error);
            }
          }
        }
      }
    }
    
    // Always respond with OK to YooKassa
    res.status(200).send("OK");
  } catch (error) {
    console.error("Error processing YooKassa webhook:", error);
    res.status(200).send("OK"); // Still return OK to avoid retries
  }
});

// Promo codes validation endpoint
router.post("/api/promo-codes/validate", async (req, res) => {
  try {
    const { code } = req.body;
    if (!code) {
      return res.status(400).json({ error: "Promo code is required" });
    }

    const validation = await storage.validatePromoCode(code);
    res.json(validation);
  } catch (error) {
    console.error("Error validating promo code:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get user's owned promo code and usage stats
router.get("/api/promo-codes/owner/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    
    const PromoCodeRepo = AppDataSource.getRepository(PromoCodeEntity);
    const PromoCodeUsageRepo = AppDataSource.getRepository(PromoCodeUsageEntity);
    
    // Find promo code owned by this user
    const promoCode = await PromoCodeRepo.findOne({
      where: { ownerId: userId },
      relations: ['owner']
    });
    
    if (!promoCode) {
      return res.json(null);
    }
    
    // Get usage statistics
    const usages = await PromoCodeUsageRepo.find({
      where: { promoCodeId: promoCode.id },
      relations: ['user', 'order'],
      order: { createdAt: 'DESC' }
    });
    
    // Calculate total points earned
    const totalPointsEarned = usages.reduce((sum, usage) => sum + (usage.pointsAwarded || 0), 0);
    
    res.json({
      promoCode,
      stats: {
        totalUses: promoCode.usedCount,
        totalPointsEarned,
        recentUsages: usages.slice(0, 10) // Last 10 usages
      }
    });
  } catch (error) {
    console.error("Error fetching owner promo code:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/api/orders", async (req, res) => {
  try {
    const orderData: CreateOrderDto & {
      promoCode?: string;
      loyaltyPointsUsed?: number
    } = req.body;

    // Выполняем все операции в транзакции для предотвращения race conditions
    const order: any = await AppDataSource.transaction(async (manager) => {
      let finalOrderData = { ...orderData };
      let trainer = null;
      let promoCodeData = null;

      // Handle promo code if provided
      if (orderData.promoCode) {
        const PromoCodeRepo = manager.getRepository(PromoCodeEntity);
        const TrainerRepo = manager.getRepository(TrainerEntity);
        
        // Use pessimistic write lock to prevent race conditions
        promoCodeData = await PromoCodeRepo.findOne({ 
          where: { code: orderData.promoCode.toUpperCase() },
          lock: { mode: 'pessimistic_write' }
        });

        if (promoCodeData && promoCodeData.isActive) {
          // Проверка валидности
          if (promoCodeData.expiresAt && promoCodeData.expiresAt < new Date()) {
            throw new Error("Промокод истек");
          }
          if (promoCodeData.maxUses && promoCodeData.usedCount >= promoCodeData.maxUses) {
            throw new Error("Промокод исчерпан");
          }

          // Получаем тренера если есть
          if (promoCodeData.trainerId) {
            trainer = await TrainerRepo.findOne({ 
              where: { id: promoCodeData.trainerId },
              lock: { mode: 'pessimistic_write' }
            });
          }

          // Apply discount
          const discountPercent = promoCodeData.discountPercent || 0;
          const discount = Math.floor(orderData.totalPrice * (discountPercent / 100));
          finalOrderData.totalPrice = orderData.totalPrice - discount;
          finalOrderData.promoCodeId = promoCodeData.id;
          finalOrderData.trainerId = trainer?.id;
          finalOrderData.discountPercent = discountPercent;
          finalOrderData.discountAmount = discount;

          // Mark promo code as used atomically
          promoCodeData.usedCount += 1;
          await manager.save(promoCodeData);
        }
      }

      // Resolve user ID and validate - ALWAYS validate user existence
      const OrderRepo = manager.getRepository(OrderEntity);
      const UserRepo = manager.getRepository(UserEntity);
      
      let actualUserId = orderData.userId;
      let userForLoyalty = null;
      
      // ALWAYS validate user exists, regardless of loyalty points usage
      if (orderData.userId) {
        const isTelegramId = /^\d+$/.test(orderData.userId);
        const needsLock = orderData.loyaltyPointsUsed && orderData.loyaltyPointsUsed > 0;
        
        const lockMode = needsLock 
          ? { lock: { mode: 'pessimistic_write' as const } } 
          : {};
        
        const user = await UserRepo.findOne({
          where: isTelegramId ? { telegramId: orderData.userId } : { id: orderData.userId },
          ...lockMode
        });
        
        if (!user) {
          throw new Error('Пользователь не найден');
        }
        
        // Always use validated UUID from database
        actualUserId = user.id;
        
        // If using loyalty points, validate balance
        if (orderData.loyaltyPointsUsed && orderData.loyaltyPointsUsed > 0) {
          if ((user.loyaltyPoints || 0) < orderData.loyaltyPointsUsed) {
            throw new Error(`Недостаточно баллов лояльности. Доступно: ${user.loyaltyPoints || 0}, требуется: ${orderData.loyaltyPointsUsed}`);
          }
          userForLoyalty = user;
          finalOrderData.totalPrice = Math.max(0, finalOrderData.totalPrice - orderData.loyaltyPointsUsed);
          finalOrderData.loyaltyPointsUsed = orderData.loyaltyPointsUsed;
        }
      }

      // Generate unique order number
      const orderNumber = `KB${Date.now().toString().slice(-6)}${Math.floor(Math.random() * 10000)}`;
      
      const newOrder = OrderRepo.create({
        orderNumber,
        userId: actualUserId,
        boxId: finalOrderData.boxId || null,
        productId: finalOrderData.productId || null,
        customerName: finalOrderData.customerName,
        customerPhone: finalOrderData.customerPhone,
        customerEmail: finalOrderData.customerEmail,
        deliveryMethod: finalOrderData.deliveryMethod,
        paymentMethod: finalOrderData.paymentMethod,
        totalPrice: finalOrderData.totalPrice,
        selectedSize: finalOrderData.selectedSize || null,
        cartItems: finalOrderData.cartItems || null,
        promoCodeId: finalOrderData.promoCodeId,
        trainerId: finalOrderData.trainerId,
        discountPercent: finalOrderData.discountPercent,
        discountAmount: finalOrderData.discountAmount,
        loyaltyPointsUsed: finalOrderData.loyaltyPointsUsed || 0,
        status: "pending",
      } as any);
      
      const createdOrder: any = await manager.save(newOrder);

      // Award/deduct loyalty points within transaction
      const LoyaltyRepo = manager.getRepository(LoyaltyTransactionEntity);
      
      // Handle loyalty point operations
      if (createdOrder.userId) {
        // Use already-locked user if available, otherwise lock now
        const user = userForLoyalty || await UserRepo.findOne({ 
          where: { id: createdOrder.userId },
          lock: { mode: 'pessimistic_write' }
        });

        if (user) {
          // Award points if trainer promo code was used
          if (trainer) {
            const loyaltyPoints = Math.floor(orderData.totalPrice * 0.05);
            if (loyaltyPoints > 0) {
              const earnTransaction = LoyaltyRepo.create({
                userId: createdOrder.userId,
                orderId: createdOrder.id,
                type: 'earn',
                points: loyaltyPoints,
                description: `Начислено за заказ по промокоду тренера ${createdOrder.orderNumber}`
              });
              await manager.save(earnTransaction);
              user.loyaltyPoints = (user.loyaltyPoints || 0) + loyaltyPoints;
            }
          }

          // Deduct points if used (already validated earlier)
          if (createdOrder.loyaltyPointsUsed > 0) {
            const spendTransaction = LoyaltyRepo.create({
              userId: createdOrder.userId,
              orderId: createdOrder.id,
              type: 'spend',
              points: -createdOrder.loyaltyPointsUsed,
              description: `Использовано баллов для оплаты заказа ${createdOrder.orderNumber}`
            });
            await manager.save(spendTransaction);
            user.loyaltyPoints = (user.loyaltyPoints || 0) - createdOrder.loyaltyPointsUsed;
          }

          // Save updated user balance atomically
          await manager.save(user);
        }
      }

      // Update trainer stats if trainer promo code was used
      if (trainer && orderData.totalPrice) {
        const trainerEntity: any = trainer;
        trainerEntity.totalRevenue = (trainerEntity.totalRevenue || 0) + orderData.totalPrice;
        trainerEntity.ordersCount = (trainerEntity.ordersCount || 0) + 1;
        await manager.save(trainerEntity);
      }

      // Note: Promo code owner points are awarded in YooKassa webhook upon successful payment
      // This ensures points are only given for paid orders

      return createdOrder;
    });

    // Sync order to RetailCRM (async, don't wait for result)
    syncOrderToRetailCRMSafe(order);

    res.status(201).json(order);
  } catch (error) {
    console.error("Error creating order:", error);
    res.status(500).json({ error: error instanceof Error ? error.message : "Internal server error" });
  }
});

// Safe wrapper for RetailCRM sync (doesn't block order creation)
// Note: These functions are defined at the end of the file after syncOrderToRetailCRM
async function syncOrderToRetailCRMSafe(order: any) {
  setTimeout(async () => {
    try {
      await syncOrderToRetailCRM(order);
    } catch (error) {
      console.error("[RetailCRM] Sync failed (non-blocking):", error);
    }
  }, 100);
}

async function updateOrderStatusInRetailCRMSafe(orderNumber: string, status: string) {
  setTimeout(async () => {
    try {
      await updateOrderStatusInRetailCRM(orderNumber, status);
    } catch (error) {
      console.error("[RetailCRM] Status update failed (non-blocking):", error);
    }
  }, 100);
}

// Notifications
router.post("/api/notifications", async (req, res) => {
  try {
    const notificationData: CreateNotificationDto = req.body;
    const notification = await storage.createNotification(notificationData);
    res.status(201).json(notification);
  } catch (error) {
    console.error("Error creating notification:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/api/notifications/box/:boxId", async (req, res) => {
  try {
    const notifications = await storage.getNotificationsByBox(req.params.boxId);
    res.json(notifications);
  } catch (error) {
    console.error("Error fetching notifications:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Admin token verification middleware
function verifyAdminToken(req: any, res: any, next: any) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  // Проверяем новый безопасный токен
  if (verifyToken(token)) {
    return next();
  }
  
  // Для обратной совместимости проверяем старый формат (временно)
  if (token.startsWith('admin-token-')) {
    console.warn('⚠️ Используется устаревший формат токена. Рекомендуется перелогиниться.');
    return next();
  }
  
  return res.status(401).json({ error: 'Unauthorized' });
}

// Admin trainers management
router.get("/api/admin/trainers", verifyAdminToken, async (req, res) => {
  try {
    const trainers = await storage.getAllTrainers();
    res.json(trainers);
  } catch (error) {
    console.error("Error fetching trainers:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.put("/api/admin/trainers/:id/discount", verifyAdminToken, async (req, res) => {
  try {
    const { discountPercent } = req.body;
    const trainer = await storage.updateTrainerDiscount(req.params.id, discountPercent);
    if (!trainer) {
      return res.status(404).json({ error: "Trainer not found" });
    }
    res.json(trainer);
  } catch (error) {
    console.error("Error updating trainer discount:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Admin authentication
router.post("/api/admin/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    // Проверка учетных данных
    if (username === "admin" && password === process.env.ADMIN_PASSWORD) {
      // Генерируем криптографически стойкий токен
      const token = createAdminToken(username);
      res.json({ success: true, token });
    } else {
      res.status(401).json({ success: false, message: "Неверные данные" });
    }
  } catch (error) {
    console.error("Error in admin login:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Admin routes
router.get("/api/admin/orders", verifyAdminToken, async (req, res) => {
  try {
    const orders = await storage.getAllOrders();

    // Добавляем информацию о боксах и пользователях к заказам
    const ordersWithFullInfo = await Promise.all(
      orders.map(async (order) => {
        let boxName = 'Неизвестный набор';
        let userInfo = null;

        // Получаем информацию о боксе
        if (order.boxId) {
          const box = await storage.getBox(order.boxId);
          boxName = box?.name || 'Неизвестный набор';
        }

        // Получаем информацию о пользователе
        if (order.userId) {
          const user = await storage.getUser(order.userId);
          if (user) {
            userInfo = {
              username: user.username,
              firstName: user.firstName,
              lastName: user.lastName,
              telegramId: user.telegramId
            };
          }
        }

        return {
          ...order,
          boxName,
          userInfo
        };
      })
    );

    res.json(ordersWithFullInfo);
  } catch (error) {
    console.error("Error fetching all orders:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/api/admin/orders/:id", verifyAdminToken, async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await storage.deleteOrder(id);
    if (!deleted) {
      return res.status(404).json({ error: "Order not found" });
    }
    res.json({ success: true, message: "Order deleted successfully" });
  } catch (error) {
    console.error("Error deleting order:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/api/admin/users", verifyAdminToken, async (req, res) => {
  try {
    const users = await storage.getAllUsers();
    res.json(users);
  } catch (error) {
    console.error("Error fetching all users:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Admin user details
router.get("/api/admin/users/:id/orders", verifyAdminToken, async (req, res) => {
  try {
    const orders = await storage.getOrdersByUserId(req.params.id);
    res.json(orders);
  } catch (error) {
    console.error("Error fetching user orders:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/api/admin/users/:id/loyalty", verifyAdminToken, async (req, res) => {
  try {
    const loyaltyStats = await storage.getLoyaltyStatsByUserId(req.params.id);
    res.json(loyaltyStats);
  } catch (error) {
    console.error("Error fetching user loyalty stats:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/api/admin/boxes", verifyAdminToken, async (req, res) => {
  try {
    const boxes = await storage.getAllBoxes();
    res.json(boxes);
  } catch (error) {
    console.error("Error fetching all boxes:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/api/admin/boxes", verifyAdminToken, async (req, res) => {
  try {
    const createData = req.body;

    // Детальное логирование для отладки
    console.log("🔍 DEBUG: Создание бокса - начало обработки");
    console.log("Полученные данные:", JSON.stringify(createData, null, 2));
    console.log("Authorization присутствует:", req.headers.authorization ? "ДА" : "НЕТ");

    // Validate required fields
    if (!createData.name || !createData.price) {
      console.log("❌ Ошибка валидации: отсутствуют name или price");
      console.log("name:", createData.name);
      console.log("price:", createData.price);
      return res.status(400).json({ error: "Name and price are required" });
    }

    // Validate products if provided (max 10 products)
    if (createData.productIds && createData.productIds.length > 10) {
      return res.status(400).json({ error: "Box can contain maximum 10 products" });
    }

    // Выполняем создание бокса и добавление продуктов в транзакции
    const newBox = await AppDataSource.transaction(async (transactionalEntityManager) => {
      // Преобразуем данные для совместимости с сущностью Box
      const boxCreateData: CreateBoxDto = {
        name: createData.name,
        description: createData.description,
        price: createData.price,
        category: createData.category,
        imageUrl: createData.image || createData.imageUrl,
        photoUrl: createData.photoUrl,
        sportTypes: createData.sportTypes || [],
        availableTopSizes: createData.availableTopSizes || [],
        availableBottomSizes: createData.availableBottomSizes || [],
        isAvailable: createData.isAvailable !== false,
        productIds: createData.productIds || [],
        productQuantities: createData.productQuantities || []
      };

      console.log("📦 Создаем бокс с данными:", JSON.stringify(boxCreateData, null, 2));
      const createdBox = await storage.createBox(boxCreateData);
      console.log("✅ Бокс создан успешно:", createdBox.id);

      // Если были переданы товары, создаем связи BoxProduct (в той же транзакции)
      if (createData.productIds && createData.productIds.length > 0) {
        console.log("🔗 Добавляем товары в бокс:", createData.productIds);
        for (let i = 0; i < createData.productIds.length; i++) {
          const productId = createData.productIds[i];
          const quantity = createData.productQuantities?.[i] || 1;
          
          // В транзакции НЕ используем try-catch - если ошибка, откатываем всё
          await storage.addProductToBox(createdBox.id, productId, quantity);
          console.log(`✅ Товар ${productId} добавлен в бокс`);
        }
      }

      return createdBox;
    });

    console.log("🎉 Бокс полностью создан и настроен");
    res.status(201).json(newBox);
  } catch (error) {
    console.error("Error creating box:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.put("/api/admin/boxes/:id", verifyAdminToken, async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    console.log("📝 Обновление бокса:", id);
    console.log("Данные для обновления:", JSON.stringify(updateData, null, 2));

    // Преобразуем данные для совместимости с сущностью Box
    const boxUpdateData: Partial<CreateBoxDto> = {
      name: updateData.name,
      description: updateData.description,
      price: updateData.price,
      category: updateData.category,
      imageUrl: updateData.imageUrl || updateData.image, // поддерживаем оба поля
      photoUrl: updateData.photoUrl,
      sportTypes: updateData.sportTypes || [], // добавляем поддержку видов спорта
      availableTopSizes: updateData.availableTopSizes,
      availableBottomSizes: updateData.availableBottomSizes,
    };

    // Validate products if provided (max 10 products)
    if (updateData.productIds && updateData.productIds.length > 10) {
      return res.status(400).json({ error: "Box can contain maximum 10 products" });
    }

    const updatedBox = await storage.updateBox(id, boxUpdateData);
    if (!updatedBox) {
      return res.status(404).json({ error: "Box not found" });
    }

    // Обработка товаров, если они переданы
    if (updateData.productIds !== undefined) {
      console.log("🔄 Обновляем товары в боксе");
      
      // Получаем текущие товары
      const currentProducts = await storage.getBoxProducts(id);
      console.log(`Текущих товаров: ${currentProducts.length}`);
      
      // Удаляем все текущие связи
      for (const boxProduct of currentProducts) {
        await storage.removeProductFromBox(id, boxProduct.productId);
        console.log(`🗑️ Удалена связь с товаром ${boxProduct.productId}`);
      }
      
      // Добавляем новые товары
      if (updateData.productIds && updateData.productIds.length > 0) {
        console.log(`➕ Добавляем ${updateData.productIds.length} товаров`);
        
        for (let i = 0; i < updateData.productIds.length; i++) {
          const productId = updateData.productIds[i];
          const quantity = updateData.productQuantities?.[i] || 1;
          
          try {
            await storage.addProductToBox(id, productId, quantity);
            console.log(`✅ Товар ${productId} добавлен (количество: ${quantity})`);
          } catch (productError) {
            console.error(`❌ Ошибка добавления товара ${productId}:`, productError);
          }
        }
      }
    }

    console.log("✅ Бокс успешно обновлен");
    res.json(updatedBox);
  } catch (error) {
    console.error("Error updating box:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.patch("/api/admin/boxes/:id", verifyAdminToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { inventory } = req.body;

    if (inventory !== undefined && typeof inventory !== 'object') {
      return res.status(400).json({ error: "Inventory must be an object" });
    }

    const box = await storage.updateBox(id, { inventory });
    if (!box) {
      return res.status(404).json({ error: "Box not found" });
    }

    res.json(box);
  } catch (error) {
    console.error("Error updating box inventory:", error);
    res.status(500).json({ error: "Failed to update box inventory" });
  }
});

router.delete("/api/admin/boxes/:id", verifyAdminToken, async (req, res) => {
  try {
    const { id } = req.params;
    await storage.deleteBox(id);
    res.json({ success: true });
  } catch (error) {
    console.error("Error deleting box:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/api/admin/products", verifyAdminToken, async (req, res) => {
  try {
    const products = await storage.getAllProducts();
    res.json(products);
  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(500).json({ error: "Failed to fetch products" });
  }
});

// Multer для Excel файлов
const excelUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.ms-excel"
    ];
    if (allowedTypes.includes(file.mimetype) || file.originalname.endsWith('.xlsx') || file.originalname.endsWith('.xls')) {
      cb(null, true);
    } else {
      cb(new Error("Недопустимый тип файла. Разрешены: .xlsx, .xls"));
    }
  },
});

// Импорт остатков из Excel
router.post("/api/admin/import-inventory", verifyAdminToken, excelUpload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "Файл не загружен" });
    }

    const { sheetName, productColumn, sizeColumn, quantityColumn } = req.body;
    const productCol = productColumn || 'C';
    const sizeCol = sizeColumn || 'F';
    const qtyCol = quantityColumn || 'G';

    const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
    
    // Найти лист по имени или использовать первый
    let sheet;
    if (sheetName && workbook.SheetNames.includes(sheetName)) {
      sheet = workbook.Sheets[sheetName];
    } else {
      // Попробуем найти лист с "остатк" в названии
      const foundSheet = workbook.SheetNames.find(name => 
        name.toLowerCase().includes('остатк') || name.toLowerCase().includes('актуальн')
      );
      sheet = workbook.Sheets[foundSheet || workbook.SheetNames[0]];
    }

    if (!sheet) {
      return res.status(400).json({ error: "Лист не найден" });
    }

    // Парсим данные из Excel
    const range = XLSX.utils.decode_range(sheet['!ref'] || 'A1');
    const inventoryUpdates: { productName: string; size: string; quantity: number }[] = [];

    for (let row = range.s.r + 1; row <= range.e.r; row++) {
      const productCell = sheet[`${productCol}${row + 1}`];
      const sizeCell = sheet[`${sizeCol}${row + 1}`];
      const qtyCell = sheet[`${qtyCol}${row + 1}`];

      if (productCell && sizeCell && qtyCell) {
        const productName = String(productCell.v || '').trim();
        const size = String(sizeCell.v || '').trim().toUpperCase();
        const quantity = parseInt(String(qtyCell.v || '0')) || 0;

        if (productName && size && quantity >= 0) {
          inventoryUpdates.push({ productName, size, quantity });
        }
      }
    }

    // Получаем все товары
    const products = await storage.getAllProducts();
    let updated = 0;
    let notFound: string[] = [];

    // Группируем обновления по товарам
    const updatesByProduct = new Map<string, Record<string, number>>();
    
    for (const update of inventoryUpdates) {
      // Ищем товар по частичному совпадению названия
      const product = products.find(p => 
        p.name.toLowerCase().includes(update.productName.toLowerCase()) ||
        update.productName.toLowerCase().includes(p.name.toLowerCase())
      );

      if (product) {
        if (!updatesByProduct.has(product.id)) {
          updatesByProduct.set(product.id, { ...(product.inventory || {}) });
        }
        const inventory = updatesByProduct.get(product.id)!;
        inventory[update.size] = update.quantity;
      } else {
        if (!notFound.includes(update.productName)) {
          notFound.push(update.productName);
        }
      }
    }

    // Применяем обновления
    for (const [productId, inventory] of updatesByProduct) {
      await storage.updateProduct(productId, { inventory });
      updated++;
    }

    res.json({
      success: true,
      message: `Обновлено ${updated} товаров`,
      updated,
      totalRows: inventoryUpdates.length,
      notFound: notFound.slice(0, 10)
    });
  } catch (error) {
    console.error("Error importing inventory:", error);
    res.status(500).json({ error: "Ошибка при импорте остатков" });
  }
});

router.get("/api/admin/box-products/stats", verifyAdminToken, async (req, res) => {
  try {
    // Get all boxes with their products
    const boxes = await storage.getAllBoxes();
    let totalProductsInBoxes = 0;

    for (const box of boxes) {
      const boxProducts = await storage.getBoxProducts(box.id);
      totalProductsInBoxes += boxProducts.reduce((sum, bp) => sum + bp.quantity, 0);
    }

    res.json({
      totalBoxes: boxes.length,
      totalProductsInBoxes,
      averageProductsPerBox: boxes.length > 0 ? Math.round(totalProductsInBoxes / boxes.length * 100) / 100 : 0
    });
  } catch (error) {
    console.error("Error fetching box products stats:", error);
    res.status(500).json({ error: "Failed to fetch box products stats" });
  }
});

router.post("/api/admin/products", verifyAdminToken, async (req, res) => {
  try {
    const productData: CreateProductDto = req.body;

    // Validate required fields
    if (!productData.name || !productData.price) {
      return res.status(400).json({ error: "Name and price are required" });
    }

    // Функция проверки на base64 Data URL с нормализацией (защита от обхода)
    const isDataUrl = (url: string) => url.trim().toLowerCase().startsWith('data:');
    
    // Защита от base64 Data URLs - отклоняем их
    if (productData.imageUrl && isDataUrl(productData.imageUrl)) {
      console.error("❌ Попытка создать товар с base64 Data URL в imageUrl");
      return res.status(400).json({ 
        error: "Недопустимый формат изображения. Используйте загрузку через /api/upload/product-image" 
      });
    }
    
    if (productData.images && productData.images.some(url => isDataUrl(url))) {
      console.error("❌ Попытка создать товар с base64 Data URL в images");
      return res.status(400).json({ 
        error: "Недопустимый формат изображений. Используйте загрузку через /api/upload/product-image" 
      });
    }

    const product = await storage.createProduct(productData);
    res.status(201).json(product);
  } catch (error) {
    console.error("Error creating product:", error);
    res.status(500).json({ error: "Failed to create product" });
  }
});

router.put("/api/admin/products/:id", verifyAdminToken, async (req, res) => {
  try {
    const { id } = req.params;
    const productData: Partial<CreateProductDto> = req.body;

    console.log("📝 Обновление товара:", id);
    console.log("Полученные данные:", JSON.stringify({
      ...productData,
      imageUrl: productData.imageUrl?.substring(0, 100) + (productData.imageUrl && productData.imageUrl.length > 100 ? '...' : ''),
      images: productData.images?.map(url => url.substring(0, 100) + (url.length > 100 ? '...' : ''))
    }, null, 2));

    // Validate required fields if provided
    if ((productData.name !== undefined && !productData.name) ||
      (productData.price !== undefined && !productData.price)) {
      return res.status(400).json({ error: "Name and price cannot be empty" });
    }

    // Функция проверки на base64 Data URL с нормализацией (защита от обхода)
    const isDataUrl = (url: string) => url.trim().toLowerCase().startsWith('data:');
    
    // Защита от base64 Data URLs - отклоняем их
    if (productData.imageUrl && isDataUrl(productData.imageUrl)) {
      console.error("❌ Попытка сохранить base64 Data URL в imageUrl:", productData.imageUrl.substring(0, 50));
      return res.status(400).json({ 
        error: "Недопустимый формат изображения. Используйте загрузку через /api/upload/product-image" 
      });
    }
    
    if (productData.images && productData.images.some(url => isDataUrl(url))) {
      console.error("❌ Попытка сохранить base64 Data URL в images");
      return res.status(400).json({ 
        error: "Недопустимый формат изображений. Используйте загрузку через /api/upload/product-image" 
      });
    }

    const product = await storage.updateProduct(id, productData);
    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    console.log("✅ Товар успешно обновлен");
    res.json(product);
  } catch (error) {
    console.error("❌ Error updating product:", error);
    console.error("Stack trace:", error instanceof Error ? error.stack : "No stack trace");
    res.status(500).json({ 
      error: "Failed to update product",
      details: error instanceof Error ? error.message : String(error)
    });
  }
});

router.patch("/api/admin/products/:id", verifyAdminToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { inventory } = req.body;

    if (inventory !== undefined && typeof inventory !== 'object') {
      return res.status(400).json({ error: "Inventory must be an object" });
    }

    const product = await storage.updateProduct(id, { inventory });
    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    res.json(product);
  } catch (error) {
    console.error("Error updating product inventory:", error);
    res.status(500).json({ error: "Failed to update product inventory" });
  }
});

router.delete("/api/admin/products/:id", verifyAdminToken, async (req, res) => {
  try {
    const { id } = req.params;
    await storage.deleteProduct(id);
    res.json({ success: true });
  } catch (error) {
    console.error("Error deleting product:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Promo codes admin endpoints
router.get('/api/admin/promo-codes', verifyAdminToken, async (req, res) => {
  try {
    const promoCodes = await storage.getAllPromoCodes();
    res.json(promoCodes);
  } catch (error) {
    console.error('Error fetching promo codes:', error);
    res.status(500).json({ error: 'Failed to fetch promo codes' });
  }
});

router.post('/api/admin/promo-codes', verifyAdminToken, async (req, res) => {
  try {
    const { code, discountPercent, maxUses, partnerName, partnerContact, expiresAt, ownerIdentifier, pointsPerUse } = req.body;

    // Validate required fields
    if (!code || !partnerName || !partnerContact) {
      return res.status(400).json({ error: 'Заполните все обязательные поля: код, название партнера, контакты' });
    }

    // Validate pointsPerUse
    const validatedPoints = parseInt(pointsPerUse) || 0;
    if (validatedPoints < 0) {
      return res.status(400).json({ error: 'Количество баллов за использование не может быть отрицательным' });
    }

    // Validate discount percent
    if (discountPercent < 0 || discountPercent > 100) {
      return res.status(400).json({ error: 'Размер скидки должен быть от 0 до 100%' });
    }

    // Check if code already exists
    const existingCode = await storage.getPromoCodeByCode(code);
    if (existingCode) {
      return res.status(400).json({ error: 'Промокод уже существует' });
    }

    // Find owner if specified
    let ownerId = undefined;
    if (ownerIdentifier && ownerIdentifier.trim()) {
      const owner = await storage.getUserByTelegramIdOrUsername(ownerIdentifier.trim());
      if (!owner) {
        return res.status(404).json({ 
          error: `Пользователь с Telegram ID или username "${ownerIdentifier}" не найден. Убедитесь, что пользователь зарегистрирован в системе.` 
        });
      }
      ownerId = owner.id;
    }

    const promoCode = await storage.createPromoCode({
      code: code.toUpperCase(),
      type: 'general',
      discountPercent,
      maxUses,
      expiresAt: expiresAt ? new Date(expiresAt) : undefined,
      ownerId,
      pointsPerUse: validatedPoints
    });

    res.json(promoCode);
  } catch (error) {
    console.error('Error creating promo code:', error);
    res.status(500).json({ error: 'Не удалось создать промокод. Попробуйте еще раз.' });
  }
});

router.put('/api/admin/promo-codes/:id/toggle', verifyAdminToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    const promoCode = await storage.updatePromoCodeStatus(id, isActive);
    if (!promoCode) {
      return res.status(404).json({ error: 'Promo code not found' });
    }

    res.json(promoCode);
  } catch (error) {
    console.error('Error updating promo code status:', error);
    res.status(500).json({ error: 'Failed to update promo code status' });
  }
});

router.get('/api/admin/promo-codes/:id/orders', verifyAdminToken, async (req, res) => {
  try {
    const { id } = req.params;
    const orders = await storage.getOrdersByPromoCodeId(id);
    res.json(orders);
  } catch (error) {
    console.error('Error fetching promo code orders:', error);
    res.status(500).json({ error: 'Failed to fetch promo code orders' });
  }
});

// Get promo code usage statistics
router.get('/api/admin/promo-codes/:id/usage', verifyAdminToken, async (req, res) => {
  try {
    const { id } = req.params;
    const usageStats = await storage.getPromoCodeUsageStats(id);
    res.json(usageStats);
  } catch (error) {
    console.error('Error fetching promo code usage stats:', error);
    res.status(500).json({ error: 'Failed to fetch usage statistics' });
  }
});

// Search users by Telegram ID or username
router.get('/api/admin/users/search', verifyAdminToken, async (req, res) => {
  try {
    const { query } = req.query;
    if (!query) {
      return res.status(400).json({ error: 'Query parameter is required' });
    }
    
    const user = await storage.getUserByTelegramIdOrUsername(query as string);
    if (!user) {
      return res.status(404).json({ error: 'Пользователь не найден' });
    }
    
    res.json(user);
  } catch (error) {
    console.error('Error searching user:', error);
    res.status(500).json({ error: 'Failed to search user' });
  }
});

// ==================== BROADCAST ROUTES ====================
import { Broadcast, BroadcastButton } from "./entities/Broadcast";

// Get all broadcasts
router.get('/api/admin/broadcasts', verifyAdminToken, async (req, res) => {
  try {
    const broadcastRepo = AppDataSource.getRepository(Broadcast);
    const broadcasts = await broadcastRepo.find({
      order: { createdAt: 'DESC' }
    });
    res.json(broadcasts);
  } catch (error) {
    console.error('Error fetching broadcasts:', error);
    res.status(500).json({ error: 'Failed to fetch broadcasts' });
  }
});

// Create broadcast
router.post('/api/admin/broadcasts', verifyAdminToken, async (req, res) => {
  try {
    const { title, message, imageUrl, buttons } = req.body;
    
    if (!title || !message) {
      return res.status(400).json({ error: 'Title and message are required' });
    }
    
    const broadcastRepo = AppDataSource.getRepository(Broadcast);
    const broadcast = broadcastRepo.create({
      title,
      message,
      imageUrl: imageUrl || null,
      buttons: buttons || [],
      status: 'draft'
    });
    
    await broadcastRepo.save(broadcast);
    res.json(broadcast);
  } catch (error) {
    console.error('Error creating broadcast:', error);
    res.status(500).json({ error: 'Failed to create broadcast' });
  }
});

// Update broadcast
router.put('/api/admin/broadcasts/:id', verifyAdminToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, message, imageUrl, buttons } = req.body;
    
    const broadcastRepo = AppDataSource.getRepository(Broadcast);
    const broadcast = await broadcastRepo.findOne({ where: { id } });
    
    if (!broadcast) {
      return res.status(404).json({ error: 'Broadcast not found' });
    }
    
    if (broadcast.status !== 'draft') {
      return res.status(400).json({ error: 'Cannot edit sent broadcast' });
    }
    
    broadcast.title = title || broadcast.title;
    broadcast.message = message || broadcast.message;
    broadcast.imageUrl = imageUrl !== undefined ? imageUrl : broadcast.imageUrl;
    broadcast.buttons = buttons || broadcast.buttons;
    
    await broadcastRepo.save(broadcast);
    res.json(broadcast);
  } catch (error) {
    console.error('Error updating broadcast:', error);
    res.status(500).json({ error: 'Failed to update broadcast' });
  }
});

// Delete broadcast
router.delete('/api/admin/broadcasts/:id', verifyAdminToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    const broadcastRepo = AppDataSource.getRepository(Broadcast);
    const broadcast = await broadcastRepo.findOne({ where: { id } });
    
    if (!broadcast) {
      return res.status(404).json({ error: 'Broadcast not found' });
    }
    
    await broadcastRepo.remove(broadcast);
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting broadcast:', error);
    res.status(500).json({ error: 'Failed to delete broadcast' });
  }
});

// Send broadcast to all users
router.post('/api/admin/broadcasts/:id/send', verifyAdminToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    const broadcastRepo = AppDataSource.getRepository(Broadcast);
    const userRepo = AppDataSource.getRepository(UserEntity);
    
    const broadcast = await broadcastRepo.findOne({ where: { id } });
    
    if (!broadcast) {
      return res.status(404).json({ error: 'Broadcast not found' });
    }
    
    if (broadcast.status === 'sending') {
      return res.status(400).json({ error: 'Broadcast is already being sent' });
    }
    
    // Get all users with Telegram ID
    const users = await userRepo.find({
      where: {},
      select: ['telegramId']
    });
    
    const telegramIds = users
      .filter(u => u.telegramId)
      .map(u => u.telegramId) as string[];
    
    if (telegramIds.length === 0) {
      return res.status(400).json({ error: 'No users to send broadcast to' });
    }
    
    // Update broadcast status
    broadcast.status = 'sending';
    broadcast.totalRecipients = telegramIds.length;
    broadcast.sentCount = 0;
    broadcast.failedCount = 0;
    await broadcastRepo.save(broadcast);
    
    // Send in background
    sendBroadcastToUsers(broadcast, telegramIds).catch(console.error);
    
    res.json({ 
      success: true, 
      message: `Sending to ${telegramIds.length} users`,
      totalRecipients: telegramIds.length
    });
  } catch (error) {
    console.error('Error sending broadcast:', error);
    res.status(500).json({ error: 'Failed to send broadcast' });
  }
});

// Preview broadcast (send to admin)
router.post('/api/admin/broadcasts/:id/preview', verifyAdminToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { telegramId } = req.body;
    
    if (!telegramId) {
      return res.status(400).json({ error: 'Telegram ID is required for preview' });
    }
    
    const broadcastRepo = AppDataSource.getRepository(Broadcast);
    const broadcast = await broadcastRepo.findOne({ where: { id } });
    
    if (!broadcast) {
      return res.status(404).json({ error: 'Broadcast not found' });
    }
    
    // Send preview to admin
    const result = await sendBroadcastMessage(telegramId, broadcast);
    
    if (result.success) {
      res.json({ success: true, message: 'Preview sent' });
    } else {
      res.status(500).json({ error: result.error || 'Failed to send preview' });
    }
  } catch (error) {
    console.error('Error sending preview:', error);
    res.status(500).json({ error: 'Failed to send preview' });
  }
});

// Helper function to send broadcast to all users
async function sendBroadcastToUsers(broadcast: Broadcast, telegramIds: string[]) {
  const broadcastRepo = AppDataSource.getRepository(Broadcast);
  let sentCount = 0;
  let failedCount = 0;
  
  // Send messages with rate limiting (20 messages per second max for Telegram)
  for (let i = 0; i < telegramIds.length; i++) {
    const telegramId = telegramIds[i];
    
    try {
      const result = await sendBroadcastMessage(telegramId, broadcast);
      
      if (result.success) {
        sentCount++;
      } else {
        failedCount++;
      }
      
      // Update progress every 10 messages
      if ((i + 1) % 10 === 0 || i === telegramIds.length - 1) {
        broadcast.sentCount = sentCount;
        broadcast.failedCount = failedCount;
        await broadcastRepo.save(broadcast);
      }
      
      // Rate limiting: max 30 messages per second
      if ((i + 1) % 30 === 0) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    } catch (error) {
      console.error(`Error sending to ${telegramId}:`, error);
      failedCount++;
    }
  }
  
  // Update final status
  broadcast.sentCount = sentCount;
  broadcast.failedCount = failedCount;
  broadcast.status = failedCount === telegramIds.length ? 'failed' : 'sent';
  broadcast.sentAt = new Date();
  await broadcastRepo.save(broadcast);
  
  console.log(`Broadcast "${broadcast.title}" completed: ${sentCount} sent, ${failedCount} failed`);
}

// Helper function to send a single broadcast message
async function sendBroadcastMessage(telegramId: string, broadcast: Broadcast): Promise<{ success: boolean; error?: string }> {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  if (!botToken) {
    return { success: false, error: 'Bot token not configured' };
  }
  
  const botUsername = process.env.TELEGRAM_BOT_USERNAME || 'kavaraappbot';
  
  // Build inline keyboard from buttons
  let inlineKeyboard: any[] = [];
  if (broadcast.buttons && broadcast.buttons.length > 0) {
    inlineKeyboard = broadcast.buttons.map((btn: BroadcastButton) => [{
      text: btn.label,
      url: `https://t.me/${botUsername}?startapp=${btn.startAppParam}`
    }]);
  }
  
  try {
    let response;
    
    if (broadcast.imageUrl) {
      // Send photo with caption
      const payload: any = {
        chat_id: telegramId,
        photo: broadcast.imageUrl,
        caption: broadcast.message,
        parse_mode: 'HTML'
      };
      
      if (inlineKeyboard.length > 0) {
        payload.reply_markup = JSON.stringify({ inline_keyboard: inlineKeyboard });
      }
      
      response = await fetch(`https://api.telegram.org/bot${botToken}/sendPhoto`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
    } else {
      // Send text message
      const payload: any = {
        chat_id: telegramId,
        text: broadcast.message,
        parse_mode: 'HTML'
      };
      
      if (inlineKeyboard.length > 0) {
        payload.reply_markup = JSON.stringify({ inline_keyboard: inlineKeyboard });
      }
      
      response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
    }
    
    const result = await response.json();
    
    if (result.ok) {
      return { success: true };
    } else {
      return { success: false, error: result.description };
    }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

// Payment routes
router.post("/api/create-payment-intent", async (req, res) => {
  try {
    const { amount, description, orderId, returnUrl, customerEmail, customerPhone } = req.body;

    console.log("Creating payment intent:", { amount, description, orderId, returnUrl, customerEmail, customerPhone });

    if (!amount || !description || !orderId) {
      console.log("Missing required fields:", { amount, description, orderId });
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Require either email or phone for receipt (54-ФЗ requirement)
    if (!customerEmail && !customerPhone) {
      return res.status(400).json({ error: "Customer email or phone is required for payment" });
    }

    const paymentAmount = typeof amount === 'string' ? parseFloat(amount) : amount;

    if (isNaN(paymentAmount) || paymentAmount <= 0) {
      console.log("Invalid amount:", paymentAmount);
      return res.status(400).json({ error: "Invalid amount" });
    }

    const paymentIntent = await createPaymentIntent({
      amount: paymentAmount,
      description: String(description),
      orderId: String(orderId),
      // Return URL for "Back to Shop" button in YooKassa - opens Telegram Mini App
      returnUrl: returnUrl || `https://t.me/kavaraappbot/app?startapp=payment_success`,
      customerEmail,
      customerPhone
    });

    console.log("Payment intent created successfully:", paymentIntent);
    res.json(paymentIntent);
  } catch (error) {
    console.error("Error creating payment intent:", error);
    res.status(500).json({
      error: "Internal server error",
      details: error instanceof Error ? error.message : JSON.stringify(error)
    });
  }
});

router.get("/api/payment-status/:paymentId", async (req, res) => {
  try {
    const paymentStatus = await checkPaymentStatus(req.params.paymentId);
    res.json(paymentStatus);
  } catch (error) {
    console.error("Error checking payment status:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// YooKassa webhook is now handled by /api/yoomoney-webhook endpoint above

export function registerRoutes(app: any) {
  app.use(router);
}

// Feedback endpoint
router.post("/api/send-feedback", async (req, res) => {
  try {
    const { type, message, username } = req.body;

    if (!message || !type) {
      return res.status(400).json({ error: "Type and message are required" });
    }

    // Send to admin Telegram channel with proper formatting
    const feedbackText = `🗨️ НОВЫЙ ОТЗЫВ

📝 Тип: ${getTypeLabel(type)}
👤 От: @${username || 'Аноним'}

💬 Сообщение:
${message}

📅 Дата: ${new Date().toLocaleString('ru-RU', { timeZone: 'Europe/Moscow' })}`;

    // Send directly to telegram bot instead of using order notification function
    const telegramMessage = {
      chat_id: '-1002812810825',
      text: feedbackText,
      parse_mode: 'HTML'
    };

    const response = await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(telegramMessage)
    });

    if (!response.ok) {
      throw new Error(`Telegram API error: ${response.status}`);
    }

    res.json({ success: true });
  } catch (error) {
    console.error("Error sending feedback:", error);
    res.status(500).json({ error: "Failed to send feedback" });
  }
});

function getTypeLabel(type: string): string {
  switch (type) {
    case 'complaint': return 'Жалоба';
    case 'suggestion': return 'Предложение';
    case 'praise': return 'Благодарность';
    case 'other': return 'Другое';
    default: return 'Не указано';
  }
}

// User Profile API Routes
router.put("/api/users/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { firstName, lastName } = req.body;

    const updatedUser = await storage.updateUser(id, { firstName, lastName });
    if (!updatedUser) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json(updatedUser);
  } catch (error) {
    console.error("Error updating user:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get user measurements endpoint
router.get("/api/users/measurements/:telegramId", async (req, res) => {
  try {
    const { telegramId } = req.params;

    const user = await storage.getUserByTelegramId(telegramId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({
      height: user.height,
      weight: user.weight,
      sleeveLength: user.sleeveLength,
      chestSize: user.chestSize,
      waistSize: user.waistSize,
      hipSize: user.hipSize,
      preferredSize: user.preferredSize
    });
  } catch (error) {
    console.error("Error fetching user measurements:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Update user measurements endpoint
router.put("/api/users/measurements/:telegramId", async (req, res) => {
  try {
    const { telegramId } = req.params;
    const { height, weight, sleeveLength, chestSize, waistSize, hipSize, preferredSize } = req.body;

    const updatedUser = await storage.updateUserMeasurements(telegramId, {
      height,
      weight,
      sleeveLength,
      chestSize,
      waistSize,
      hipSize,
      preferredSize
    });

    if (!updatedUser) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json(updatedUser);
  } catch (error) {
    console.error("Error updating user measurements:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Loyalty System API Routes
router.get("/api/loyalty/:userId/stats", async (req, res) => {
  try {
    const stats = await storage.getUserLoyaltyStats(req.params.userId);
    res.json(stats);
  } catch (error) {
    console.error("Error fetching loyalty stats:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/api/loyalty/:userId/transactions", async (req, res) => {
  try {
    const transactions = await storage.getLoyaltyTransactionsByUser(req.params.userId);
    res.json(transactions);
  } catch (error) {
    console.error("Error fetching loyalty transactions:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/api/loyalty/transactions", async (req, res) => {
  try {
    const transactionData: CreateLoyaltyTransactionDto = req.body;
    const transaction = await storage.createLoyaltyTransaction(transactionData);

    // Update user's loyalty points
    await storage.updateUserLoyaltyPoints(transactionData.userId, transactionData.points);

    res.status(201).json(transaction);
  } catch (error) {
    console.error("Error creating loyalty transaction:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/api/loyalty/:userId/generate-referral-code", async (req, res) => {
  try {
    const { userId } = req.params;
    const referralCode = await storage.generateReferralCode(userId);
    res.json({ referralCode });
  } catch (error) {
    console.error("Error generating referral code:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Referral System API Routes
router.get("/api/referrals/:userId", async (req, res) => {
  try {
    const referrals = await storage.getReferralsByUser(req.params.userId);
    res.json(referrals);
  } catch (error) {
    console.error("Error fetching referrals:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/api/referrals", async (req, res) => {
  try {
    const referralData: CreateReferralDto = req.body;
    const referral = await storage.createReferral(referralData);
    res.status(201).json(referral);
  } catch (error) {
    console.error("Error creating referral:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/api/referrals/code/:code", async (req, res) => {
  try {
    const user = await storage.getUserByReferralCode(req.params.code);
    if (!user) {
      return res.status(404).json({ error: "Referral code not found" });
    }
    res.json({ referrerId: user.id, referrerName: user.username || user.firstName || "Unknown" });
  } catch (error) {
    console.error("Error fetching referral by code:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/api/referrals/:userId/generate-code", async (req, res) => {
  try {
    const referralCode = await storage.generateReferralCode(req.params.userId);
    res.json({ referralCode });
  } catch (error) {
    console.error("Error generating referral code:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.put("/api/referrals/:referralId/complete", async (req, res) => {
  try {
    const referral = await storage.completeReferral(req.params.referralId);
    if (!referral) {
      return res.status(404).json({ error: "Referral not found" });
    }

    // Award bonus points to both referrer and referred user
    const bonusPoints = 500; // 500 points for successful referral

    // Give bonus to referrer
    await storage.createLoyaltyTransaction({
      userId: referral.referrerId,
      type: 'referral_bonus',
      points: bonusPoints,
      description: `Бонус за приглашение друга`
    });
    await storage.updateUserLoyaltyPoints(referral.referrerId, bonusPoints);

    // Give bonus to referred user
    await storage.createLoyaltyTransaction({
      userId: referral.referredId,
      type: 'referral_reward',
      points: bonusPoints / 2, // 250 points for joining through referral
      description: `Приветственный бонус за регистрацию по реферальной ссылке`
    });
    await storage.updateUserLoyaltyPoints(referral.referredId, bonusPoints / 2);

    res.json(referral);
  } catch (error) {
    console.error("Error completing referral:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Import catalog from kavarabrand.com
router.post("/api/admin/import-catalog", verifyAdminToken, async (req, res) => {
  try {
    console.log("Начинаем импорт каталога...");

    const products = await parseKavaraCatalog();
    const importedProducts = [];

    for (const product of products) {
      try {
        const newProduct = await storage.createProduct({
          name: product.name,
          description: product.description,
          price: product.price,
          imageUrl: product.imageUrl,
          category: product.category,
          sportTypes: product.sportTypes,
          isAvailable: true
        });
        importedProducts.push(newProduct);
      } catch (error) {
        console.error(`Ошибка при создании товара ${product.name}:`, error);
      }
    }

    console.log(`Успешно импортировано ${importedProducts.length} товаров`);
    res.json({
      success: true,
      imported: importedProducts.length,
      products: importedProducts
    });
  } catch (error) {
    console.error("Ошибка импорта каталога:", error);
    res.status(500).json({ error: "Ошибка при импорте каталога" });
  }
});

// Get catalog products (только отдельные товары, НЕ боксы)
router.get("/api/catalog", async (req, res) => {
  try {
    const { sportType, minPrice, maxPrice, category } = req.query;

    // Получаем все продукты
    let allProducts = await storage.getAllProducts();

    // Применяем фильтры
    if (category && typeof category === "string" && category !== "Все категории") {
      allProducts = allProducts.filter(product => product.category === category);
    }

    if (sportType && typeof sportType === "string" && sportType !== "Все виды спорта") {
      allProducts = allProducts.filter(product =>
        product.sportTypes && product.sportTypes.includes(sportType)
      );
    }

    if (minPrice && typeof minPrice === "string") {
      const min = parseInt(minPrice);
      allProducts = allProducts.filter(product => product.price >= min);
    }

    if (maxPrice && typeof maxPrice === "string") {
      const max = parseInt(maxPrice);
      allProducts = allProducts.filter(product => product.price <= max);
    }

    res.json(allProducts);
  } catch (error) {
    console.error("Error fetching catalog:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Cart endpoints
router.get("/api/cart/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    // Handle user validation and conversion
    let actualUserId = userId;
    if (userId && /^\d+$/.test(userId)) {
      // This is a Telegram ID, find the actual user
      const user = await storage.getUserByTelegramId(userId);
      if (user) {
        actualUserId = user.id;
      } else {
        return res.status(400).json({ error: "User not found" });
      }
    }

    const cartItems = await storage.getUserCart(actualUserId);
    res.json(cartItems);
  } catch (error) {
    console.error("Error fetching cart:", error);
    res.status(500).json({ error: "Failed to fetch cart" });
  }
});

router.post("/api/cart", async (req, res) => {
  try {
    const { userId, boxId, productId, quantity = 1, selectedSize, itemType } = req.body;

    // Determine which ID to use (backwards compatibility)
    const itemId = productId || boxId;

    // Handle user validation and conversion
    let actualUserId = userId;
    if (userId && /^\d+$/.test(userId)) {
      // This is a Telegram ID, find the actual user
      const user = await storage.getUserByTelegramId(userId);
      if (user) {
        actualUserId = user.id;
      } else {
        return res.status(400).json({ error: "User not found" });
      }
    } else if (userId && !userId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
      // Not a valid UUID and not a Telegram ID
      return res.status(400).json({ error: "Invalid user ID format" });
    }

    // Проверка наличия товара на складе
    const isProduct = itemType === "product" || await storage.getProduct(itemId);
    if (isProduct) {
      const product = await storage.getProduct(itemId);
      if (product && product.inventory) {
        const inventory = product.inventory as Record<string, number>;
        const size = selectedSize || 'default';
        const availableQty = inventory[size] || 0;
        
        if (availableQty < quantity) {
          return res.status(400).json({ 
            error: "Недостаточно товара на складе",
            message: `Размер ${size} недоступен или закончился`
          });
        }
      }
    } else {
      // Проверка для боксов
      const box = await storage.getBox(itemId);
      if (box && box.inventory) {
        const inventory = box.inventory as Record<string, number>;
        const size = selectedSize || 'default';
        const availableQty = inventory[size] || 0;
        
        if (availableQty < quantity) {
          return res.status(400).json({ 
            error: "Недостаточно товара на складе",
            message: `Размер ${size} недоступен или закончился`
          });
        }
      }
    }

    const cartItem = await storage.addToCart(actualUserId, itemId, quantity, selectedSize, itemType);
    res.json(cartItem);
  } catch (error) {
    console.error("Error adding to cart:", error);
    res.status(500).json({ error: "Failed to add to cart" });
  }
});

router.put("/api/cart/:itemId", async (req, res) => {
  try {
    const { itemId } = req.params;
    const { quantity } = req.body;
    const cartItem = await storage.updateCartItemQuantity(itemId, quantity);
    res.json(cartItem);
  } catch (error) {
    console.error("Error updating cart item:", error);
    res.status(500).json({ error: "Failed to update cart item" });
  }
});

router.delete("/api/cart/:itemId", async (req, res) => {
  try {
    const { itemId } = req.params;
    const success = await storage.removeFromCart(itemId);
    res.json({ success });
  } catch (error) {
    console.error("Error removing from cart:", error);
    res.status(500).json({ error: "Failed to remove from cart" });
  }
});

router.delete("/api/cart/clear/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const success = await storage.clearUserCart(userId);
    res.json({ success });
  } catch (error) {
    console.error("Error clearing cart:", error);
    res.status(500).json({ error: "Failed to clear cart" });
  }
});

// Favorites endpoints
router.post("/api/favorites", async (req, res) => {
  try {
    const { userId, boxId, productId } = req.body;

    if (!userId || (!boxId && !productId)) {
      return res.status(400).json({ error: "userId and either boxId or productId are required" });
    }

    const favorite = await storage.createFavorite({ userId, boxId, productId });
    res.json(favorite);
  } catch (error) {
    console.error("Error creating favorite:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/api/favorites", async (req, res) => {
  try {
    const { userId, boxId, productId } = req.body;

    if (!userId || (!boxId && !productId)) {
      return res.status(400).json({ error: "userId and either boxId or productId are required" });
    }

    const removed = await storage.removeFavorite(userId, boxId, productId);
    if (removed) {
      res.json({ success: true });
    } else {
      res.status(404).json({ error: "Favorite not found" });
    }
  } catch (error) {
    console.error("Error removing favorite:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/api/users/:userId/favorites", async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({ error: "userId is required" });
    }

    const favorites = await storage.getUserFavorites(userId);
    res.json(favorites);
  } catch (error) {
    console.error("Error fetching user favorites:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/api/favorites/check", async (req, res) => {
  try {
    const { userId, boxId, productId } = req.query;

    if (!userId || (!boxId && !productId)) {
      return res.status(400).json({ error: "userId and either boxId or productId are required" });
    }

    const isFavorite = await storage.isFavorite(userId as string, boxId as string, productId as string);
    res.json({ isFavorite });
  } catch (error) {
    console.error("Error checking favorite status:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Products endpoints
router.get("/api/products", async (req, res) => {
  try {
    const { category } = req.query;
    let products;

    if (category && typeof category === "string") {
      products = await storage.getProductsByCategory(category);
    } else {
      products = await storage.getAllProducts();
    }

    res.json(products);
  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/api/products/:id", async (req, res) => {
  try {
    const product = await storage.getProduct(req.params.id);
    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }
    res.json(product);
  } catch (error) {
    console.error("Error fetching product:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/api/products", async (req, res) => {
  try {
    const productData = req.body;
    const product = await storage.createProduct(productData);
    res.status(201).json(product);
  } catch (error) {
    console.error("Error creating product:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.put("/api/products/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const productData = req.body;
    const product = await storage.updateProduct(id, productData);

    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    res.json(product);
  } catch (error) {
    console.error("Error updating product:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// BoxProduct endpoints
router.get("/api/boxes/:boxId/products", async (req, res) => {
  try {
    const { boxId } = req.params;
    const boxProducts = await storage.getBoxProducts(boxId);
    res.json(boxProducts);
  } catch (error) {
    console.error("Error fetching box products:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/api/boxes/:boxId/products", async (req, res) => {
  try {
    const { boxId } = req.params;
    const { productId, quantity = 1 } = req.body;

    const boxProduct = await storage.addProductToBox(boxId, productId, quantity);
    res.status(201).json(boxProduct);
  } catch (error) {
    console.error("Error adding product to box:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/api/boxes/:boxId/products/:productId", async (req, res) => {
  try {
    const { boxId, productId } = req.params;
    const success = await storage.removeProductFromBox(boxId, productId);
    res.json({ success });
  } catch (error) {
    console.error("Error removing product from box:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ============= REMINDER SETTINGS ENDPOINTS =============
import { ReminderSettings } from "./entities/ReminderSettings";
import { SentReminder } from "./entities/SentReminder";

// Get all reminder settings
router.get("/api/admin/reminder-settings", verifyAdminToken, async (req, res) => {
  try {
    const repo = AppDataSource.getRepository(ReminderSettings);
    let settings = await repo.find();
    
    // Create default settings if none exist
    if (settings.length === 0) {
      const defaults = [
        {
          type: "abandoned_cart",
          enabled: false,
          delayHours: 2,
          messageTemplate: "Привет! Ты оставил товары в корзине. Не забудь оформить заказ! Переходи в приложение и заверши покупку.",
          sentCount: 0,
          convertedCount: 0
        },
        {
          type: "unpaid_order",
          enabled: false,
          delayHours: 1,
          messageTemplate: "Твой заказ ждёт оплаты! Осталось только нажать кнопку Оплатить. Не упусти свои товары!",
          sentCount: 0,
          convertedCount: 0
        }
      ];
      
      for (const def of defaults) {
        const setting = repo.create(def);
        await repo.save(setting);
      }
      
      settings = await repo.find();
    }
    
    res.json(settings);
  } catch (error) {
    console.error("Error fetching reminder settings:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Update reminder setting
router.put("/api/admin/reminder-settings/:id", verifyAdminToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { enabled, delayHours, messageTemplate } = req.body;
    
    const repo = AppDataSource.getRepository(ReminderSettings);
    const setting = await repo.findOne({ where: { id } });
    
    if (!setting) {
      return res.status(404).json({ error: "Setting not found" });
    }
    
    if (typeof enabled === 'boolean') setting.enabled = enabled;
    if (delayHours !== undefined) setting.delayHours = delayHours;
    if (messageTemplate) setting.messageTemplate = messageTemplate;
    
    await repo.save(setting);
    res.json(setting);
  } catch (error) {
    console.error("Error updating reminder setting:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get reminder statistics
router.get("/api/admin/reminder-stats", verifyAdminToken, async (req, res) => {
  try {
    const settingsRepo = AppDataSource.getRepository(ReminderSettings);
    const remindersRepo = AppDataSource.getRepository(SentReminder);
    
    const settings = await settingsRepo.find();
    const totalSent = await remindersRepo.count();
    const totalConverted = await remindersRepo.count({ where: { converted: true } });
    
    // Get recent reminders
    const recentReminders = await remindersRepo.find({
      order: { sentAt: "DESC" },
      take: 20,
      relations: ["user"]
    });
    
    res.json({
      settings,
      stats: {
        totalSent,
        totalConverted,
        conversionRate: totalSent > 0 ? ((totalConverted / totalSent) * 100).toFixed(1) : 0
      },
      recentReminders
    });
  } catch (error) {
    console.error("Error fetching reminder stats:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Manual trigger for testing reminders
router.post("/api/admin/trigger-reminders", verifyAdminToken, async (req, res) => {
  try {
    const result = await processReminders();
    res.json(result);
  } catch (error) {
    console.error("Error triggering reminders:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Test reminder buttons by sending to a specific username
router.post("/api/admin/test-reminder-buttons", verifyAdminToken, async (req, res) => {
  try {
    const { username } = req.body;
    
    if (!username) {
      return res.status(400).json({ error: "Username обязателен" });
    }
    
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    if (!botToken) {
      return res.status(500).json({ error: "Токен бота не настроен" });
    }
    
    const botUsername = process.env.TELEGRAM_BOT_USERNAME || 'kavaraappbot';
    
    // First, we need to get chat_id by username
    // Unfortunately, Telegram API doesn't allow direct username lookup
    // We need to find user in our database
    const userRepo = AppDataSource.getRepository(UserEntity);
    const user = await userRepo.findOne({ 
      where: { username: username.toLowerCase() } 
    });
    
    if (!user || !user.telegramId) {
      return res.status(404).json({ 
        error: `Пользователь @${username} не найден в базе данных. Убедитесь, что пользователь заходил в бот.` 
      });
    }
    
    // Send abandoned cart test message
    const abandonedCartResponse = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: user.telegramId,
        text: `🧪 <b>ТЕСТОВОЕ СООБЩЕНИЕ</b>\n\n🛒 Привет! Ты оставил товары в корзине. Не забудь оформить заказ!`,
        parse_mode: 'HTML',
        reply_markup: {
          inline_keyboard: [[
            { text: "🛒 Перейти в корзину", url: `https://t.me/${botUsername}?startapp=cart` }
          ]]
        }
      })
    });
    
    if (!abandonedCartResponse.ok) {
      const error = await abandonedCartResponse.json();
      console.error("Failed to send cart test:", error);
      return res.status(500).json({ error: "Не удалось отправить тест брошенной корзины" });
    }
    
    // Send unpaid order test message
    const unpaidOrderResponse = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: user.telegramId,
        text: `🧪 <b>ТЕСТОВОЕ СООБЩЕНИЕ</b>\n\n💳 Твой заказ ждёт оплаты! Осталось только нажать кнопку Оплатить.\n\nЗаказ №TEST-12345`,
        parse_mode: 'HTML',
        reply_markup: {
          inline_keyboard: [[
            { text: "💳 Оплатить заказ", url: `https://t.me/${botUsername}?startapp=profile` }
          ]]
        }
      })
    });
    
    if (!unpaidOrderResponse.ok) {
      const error = await unpaidOrderResponse.json();
      console.error("Failed to send order test:", error);
      return res.status(500).json({ error: "Не удалось отправить тест неоплаченного заказа" });
    }
    
    res.json({ success: true, message: "Тестовые сообщения отправлены" });
  } catch (error) {
    console.error("Error sending test reminder buttons:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Process reminders function
async function processReminders() {
  const settingsRepo = AppDataSource.getRepository(ReminderSettings);
  const remindersRepo = AppDataSource.getRepository(SentReminder);
  const cartRepo = AppDataSource.getRepository(CartEntity);
  const orderRepo = AppDataSource.getRepository(OrderEntity);
  const userRepo = AppDataSource.getRepository(UserEntity);
  
  const settings = await settingsRepo.find({ where: { enabled: true } });
  let sentCount = 0;
  const results: string[] = [];
  
  for (const setting of settings) {
    const cutoffTime = new Date(Date.now() - setting.delayHours * 60 * 60 * 1000);
    
    if (setting.type === "abandoned_cart") {
      // Find users with items in cart older than delay
      const abandonedCarts = await cartRepo
        .createQueryBuilder("cart")
        .select("cart.userId", "userId")
        .addSelect("MIN(cart.createdAt)", "oldestItem")
        .groupBy("cart.userId")
        .having("MIN(cart.createdAt) < :cutoff", { cutoff: cutoffTime })
        .getRawMany();
      
      for (const cart of abandonedCarts) {
        // Check reminder history for this user
        const sentReminders = await remindersRepo.find({
          where: { userId: cart.userId, type: "abandoned_cart" },
          order: { sentAt: "DESC" }
        });
        
        // Check if max reminders reached
        if (sentReminders.length >= setting.maxReminders) {
          continue;
        }
        
        // Check minimum interval since last reminder
        if (sentReminders.length > 0) {
          const lastSent = new Date(sentReminders[0].sentAt).getTime();
          const minInterval = setting.minIntervalHours * 60 * 60 * 1000;
          if (Date.now() - lastSent < minInterval) {
            continue;
          }
        }
        
        const user = await userRepo.findOne({ where: { id: cart.userId } });
        if (user?.telegramId) {
          // Send Telegram message
          try {
            const botUsername = process.env.TELEGRAM_BOT_USERNAME || 'kavaraappbot';
            await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                chat_id: user.telegramId,
                text: setting.messageTemplate,
                parse_mode: 'HTML',
                reply_markup: {
                  inline_keyboard: [[
                    { text: "🛒 Перейти в корзину", url: `https://t.me/${botUsername}?startapp=cart` }
                  ]]
                }
              })
            });
            
            // Record sent reminder
            const reminder = remindersRepo.create({
              userId: cart.userId,
              type: "abandoned_cart"
            });
            await remindersRepo.save(reminder);
            
            setting.sentCount++;
            await settingsRepo.save(setting);
            sentCount++;
            results.push(`Sent abandoned cart reminder to ${user.username || user.telegramId}`);
          } catch (e) {
            console.error("Failed to send reminder:", e);
          }
        }
      }
    }
    
    if (setting.type === "unpaid_order") {
      // Find unpaid orders older than delay
      const unpaidOrders = await orderRepo.find({
        where: { status: "pending" }
      });
      
      for (const order of unpaidOrders) {
        const orderTime = new Date(order.createdAt).getTime();
        if (orderTime < cutoffTime.getTime() && order.userId) {
          // Check reminder history for this order
          const sentReminders = await remindersRepo.find({
            where: { orderId: order.id, type: "unpaid_order" },
            order: { sentAt: "DESC" }
          });
          
          // Check if max reminders reached
          if (sentReminders.length >= setting.maxReminders) {
            continue;
          }
          
          // Check minimum interval since last reminder
          if (sentReminders.length > 0) {
            const lastSent = new Date(sentReminders[0].sentAt).getTime();
            const minInterval = setting.minIntervalHours * 60 * 60 * 1000;
            if (Date.now() - lastSent < minInterval) {
              continue;
            }
          }
          
          const user = await userRepo.findOne({ where: { id: order.userId } });
          if (user?.telegramId) {
            const message = setting.messageTemplate.replace("{orderNumber}", order.orderNumber);
            
            try {
              const botUsername = process.env.TELEGRAM_BOT_USERNAME || 'kavaraappbot';
              await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  chat_id: user.telegramId,
                  text: `${message}\n\nЗаказ №${order.orderNumber}`,
                  parse_mode: 'HTML',
                  reply_markup: {
                    inline_keyboard: [[
                      { text: "💳 Оплатить заказ", url: `https://t.me/${botUsername}?startapp=profile` }
                    ]]
                  }
                })
              });
              
              const reminder = remindersRepo.create({
                userId: order.userId,
                type: "unpaid_order",
                orderId: order.id
              });
              await remindersRepo.save(reminder);
              
              setting.sentCount++;
              await settingsRepo.save(setting);
              sentCount++;
              results.push(`Sent unpaid order reminder for #${order.orderNumber} to ${user.username || user.telegramId}`);
            } catch (e) {
              console.error("Failed to send reminder:", e);
            }
          }
        }
      }
    }
  }
  
  return { sentCount, results };
}

// Start reminder check interval (every hour)
setInterval(async () => {
  try {
    console.log("Running scheduled reminder check...");
    const result = await processReminders();
    if (result.sentCount > 0) {
      console.log(`Sent ${result.sentCount} reminders`);
    }
  } catch (error) {
    console.error("Error in scheduled reminder check:", error);
  }
}, 60 * 60 * 1000); // Every hour

// ============= RETAILCRM INTEGRATION =============
import { RetailCRMSettings } from "./entities/RetailCRMSettings";
import { retailCRM, mapKavaraOrderToRetailCRM, mapKavaraUserToRetailCRM } from "./retailcrm";

// Initialize RetailCRM from database settings
async function initRetailCRM() {
  try {
    const repo = AppDataSource.getRepository(RetailCRMSettings);
    let settings = await repo.findOne({ where: {} });
    
    if (!settings) {
      settings = repo.create({
        enabled: false,
        syncedOrdersCount: 0,
        syncedCustomersCount: 0,
      });
      await repo.save(settings);
    }
    
    if (settings.enabled && settings.apiUrl && settings.apiKey) {
      retailCRM.configure({
        apiUrl: settings.apiUrl,
        apiKey: settings.apiKey,
        siteCode: settings.siteCode || undefined,
      });
      console.log("[RetailCRM] Integration initialized");
    }
  } catch (error) {
    console.error("[RetailCRM] Failed to initialize:", error);
  }
}

// Export for calling from database.ts after DB is initialized
export { initRetailCRM };

// Get RetailCRM settings
router.get("/api/admin/retailcrm/settings", verifyAdminToken, async (req, res) => {
  try {
    const repo = AppDataSource.getRepository(RetailCRMSettings);
    let settings = await repo.findOne({ where: {} });
    
    if (!settings) {
      settings = repo.create({
        enabled: false,
        syncedOrdersCount: 0,
        syncedCustomersCount: 0,
      });
      await repo.save(settings);
    }
    
    res.json({
      enabled: settings.enabled,
      apiUrl: settings.apiUrl || "",
      siteCode: settings.siteCode || "",
      hasApiKey: !!settings.apiKey,
      syncedOrdersCount: settings.syncedOrdersCount,
      syncedCustomersCount: settings.syncedCustomersCount,
      lastSyncAt: settings.lastSyncAt,
    });
  } catch (error) {
    console.error("Error fetching RetailCRM settings:", error);
    res.status(500).json({ error: "Failed to fetch settings" });
  }
});

// Update RetailCRM settings
router.put("/api/admin/retailcrm/settings", verifyAdminToken, async (req, res) => {
  try {
    const { enabled, apiUrl, apiKey, siteCode } = req.body;
    const repo = AppDataSource.getRepository(RetailCRMSettings);
    
    let settings = await repo.findOne({ where: {} });
    if (!settings) {
      settings = repo.create({});
    }
    
    // Validate required fields when enabling integration
    if (enabled === true) {
      const finalApiUrl = apiUrl || settings.apiUrl;
      const finalApiKey = apiKey || settings.apiKey;
      
      if (!finalApiUrl || !finalApiKey) {
        return res.status(400).json({ 
          error: "API URL и API Key обязательны для включения интеграции" 
        });
      }
    }
    
    if (enabled !== undefined) settings.enabled = enabled;
    if (apiUrl !== undefined) settings.apiUrl = apiUrl;
    if (apiKey !== undefined && apiKey !== "") settings.apiKey = apiKey;
    if (siteCode !== undefined) settings.siteCode = siteCode;
    
    await repo.save(settings);
    
    if (settings.enabled && settings.apiUrl && settings.apiKey) {
      retailCRM.configure({
        apiUrl: settings.apiUrl,
        apiKey: settings.apiKey,
        siteCode: settings.siteCode || undefined,
      });
    }
    
    res.json({ success: true });
  } catch (error) {
    console.error("Error updating RetailCRM settings:", error);
    res.status(500).json({ error: "Failed to update settings" });
  }
});

// Test RetailCRM connection
router.post("/api/admin/retailcrm/test", verifyAdminToken, async (req, res) => {
  try {
    // Use saved settings if no params provided
    const repo = AppDataSource.getRepository(RetailCRMSettings);
    const settings = await repo.findOne({ where: {} });
    
    if (!settings?.apiUrl || !settings?.apiKey) {
      return res.status(400).json({ success: false, message: "API URL и API Key не настроены" });
    }
    
    retailCRM.configure({ 
      apiUrl: settings.apiUrl, 
      apiKey: settings.apiKey,
      siteCode: settings.siteCode || undefined
    });
    const result = await retailCRM.testConnection();
    
    res.json(result);
  } catch (error) {
    console.error("Error testing RetailCRM connection:", error);
    res.status(500).json({ success: false, message: "Connection test failed" });
  }
});

// Sync order to RetailCRM
async function syncOrderToRetailCRM(order: any) {
  try {
    const repo = AppDataSource.getRepository(RetailCRMSettings);
    const settings = await repo.findOne({ where: {} });
    
    if (!settings?.enabled || !retailCRM.isConfigured()) {
      return;
    }
    
    const userRepo = AppDataSource.getRepository(UserEntity);
    const user = order.userId ? await userRepo.findOne({ where: { id: order.userId } }) : null;
    
    if (user) {
      const retailCustomer = mapKavaraUserToRetailCRM(user);
      await retailCRM.createOrUpdateCustomer(retailCustomer);
      settings.syncedCustomersCount++;
    }
    
    let items: any[] = [];
    
    if (order.cartItems && Array.isArray(order.cartItems)) {
      items = order.cartItems.map((item: any) => ({
        name: item.name || item.productName || "Товар",
        price: item.price || 0,
        quantity: item.quantity || 1,
        size: item.size || item.selectedSize,
      }));
    } else if (order.box) {
      items = [{
        name: order.box.name,
        price: order.box.price,
        quantity: 1,
      }];
    } else if (order.product) {
      items = [{
        name: order.product.name,
        price: order.product.price,
        quantity: 1,
        size: order.selectedSize,
      }];
    }
    
    const retailOrder = mapKavaraOrderToRetailCRM(order, user, items);
    await retailCRM.createOrder(retailOrder);
    
    settings.syncedOrdersCount++;
    settings.lastSyncAt = new Date();
    await repo.save(settings);
    
    console.log(`[RetailCRM] Order ${order.orderNumber} synced successfully`);
  } catch (error) {
    console.error("[RetailCRM] Failed to sync order:", error);
  }
}

// Update order status in RetailCRM
async function updateOrderStatusInRetailCRM(orderNumber: string, status: string) {
  try {
    const repo = AppDataSource.getRepository(RetailCRMSettings);
    const settings = await repo.findOne({ where: {} });
    
    if (!settings?.enabled || !retailCRM.isConfigured()) {
      return;
    }
    
    const retailStatus = status === "paid" ? "complete" : status === "cancelled" ? "cancel-other" : "new";
    await retailCRM.updateOrderStatus(orderNumber, retailStatus);
    
    console.log(`[RetailCRM] Order ${orderNumber} status updated to ${retailStatus}`);
  } catch (error) {
    console.error("[RetailCRM] Failed to update order status:", error);
  }
}

// Manual sync existing orders to RetailCRM
router.post("/api/admin/retailcrm/sync-orders", verifyAdminToken, async (req, res) => {
  try {
    const settingsRepo = AppDataSource.getRepository(RetailCRMSettings);
    const settings = await settingsRepo.findOne({ where: {} });
    
    if (!settings?.enabled || !retailCRM.isConfigured()) {
      return res.status(400).json({ error: "RetailCRM не настроен" });
    }
    
    const orderRepo = AppDataSource.getRepository(OrderEntity);
    const orders = await orderRepo.find({
      relations: ["user", "box", "product"],
      order: { createdAt: "DESC" },
      take: 100,
    });
    
    let synced = 0;
    let failed = 0;
    
    for (const order of orders) {
      try {
        await syncOrderToRetailCRM(order);
        synced++;
      } catch (e) {
        failed++;
        console.error(`Failed to sync order ${order.orderNumber}:`, e);
      }
    }
    
    settings.lastSyncAt = new Date();
    await settingsRepo.save(settings);
    
    res.json({ 
      success: true, 
      synced, 
      failed,
      message: `Синхронизировано ${synced} заказов` + (failed > 0 ? `, ошибок: ${failed}` : "")
    });
  } catch (error) {
    console.error("Error syncing orders:", error);
    res.status(500).json({ error: "Sync failed" });
  }
});

export { syncOrderToRetailCRM, updateOrderStatusInRetailCRM };

export default router;