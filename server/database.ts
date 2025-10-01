import "reflect-metadata";
import { DataSource } from "typeorm";
import * as fs from "fs";
import * as path from "path";
import { User } from "./entities/User";
import { QuizResponse } from "./entities/QuizResponse";
import { Box } from "./entities/Box";
import { Order } from "./entities/Order";
import { Notification } from "./entities/Notification";
import { LoyaltyTransaction } from "./entities/LoyaltyTransaction";
import { Referral } from "./entities/Referral";
import { Trainer } from "./entities/Trainer";
import { PromoCode } from "./entities/PromoCode";
import { Favorite } from "./entities/Favorite";
import { Cart } from "./entities/Cart";
import { Product } from "./entities/Product";
import { BoxProduct } from "./entities/BoxProduct";

export const AppDataSource = new DataSource({
  type: "postgres",
  url: process.env.DATABASE_URL,
  synchronize: true, // Only for development
  logging: true, // Enable logging for debugging
  entities: [User, QuizResponse, Box, Order, Notification, LoyaltyTransaction, Referral, Trainer, PromoCode, Favorite, Cart, Product, BoxProduct],
  ssl:
    process.env.NODE_ENV === "production"
      ? { rejectUnauthorized: false }
      : false,
  dropSchema: false, // Don't drop schema automatically
});

export async function initializeDatabase() {
  try {
    await AppDataSource.initialize();
    console.log("Database connected successfully with TypeORM");

    // Run additional migrations
    try {
      const migrationPath = path.join(__dirname, "../db/migrations/02-update-products.sql");
      if (fs.existsSync(migrationPath)) {
        const migrationSql = fs.readFileSync(migrationPath, "utf8");
        await AppDataSource.query(migrationSql);
        console.log("✅ Products migration executed successfully");
      }
    } catch (migrationError) {
      console.log("Migration already applied or not needed:", migrationError.message);
    }

    // Seed initial data in background (non-blocking)
    seedDatabase().catch(error => {
      console.error("Database seeding failed (non-critical):", error);
    });
  } catch (error) {
    console.error("Database connection failed:", error);
    throw error;
  }
}

async function seedDatabase() {
  let boxRepository, productRepository, existingBoxes, existingProducts;

  try {
    boxRepository = AppDataSource.getRepository(Box);
    productRepository = AppDataSource.getRepository(Product);

    // Quick check with limits to avoid counting all records
    [existingBoxes, existingProducts] = await Promise.all([
      boxRepository.find({ take: 1 }),
      productRepository.find({ take: 1 })
    ]);

    if (existingBoxes.length > 0 && existingProducts.length > 0) {
      console.log("Database already seeded (skipping)");
      return;
    }

    console.log("Starting database seeding...");
  } catch (error) {
    console.error("Database seeding check failed:", error);
    return; // Skip seeding if check fails
  }

  // Seed products first
  if (existingProducts.length === 0) {
    const products = [
      {
        name: "KAVARA Спортивная футболка",
        description: "Дышащая футболка из премиум материала",
        price: 2500,
        imageUrl: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab",
        category: "clothing",
        sizes: ["XS", "S", "M", "L", "XL"],
        colors: ["Черный", "Белый", "Серый"],
        isAvailable: true
      },
      {
        name: "Спортивные шорты Pro",
        description: "Легкие шорты для интенсивных тренировок",
        price: 1800,
        imageUrl: "https://images.unsplash.com/photo-1506629905877-c1e5027f5b6c",
        category: "clothing",
        sizes: ["S", "M", "L", "XL"],
        colors: ["Черный", "Синий"],
        isAvailable: true
      },
      {
        name: "Компрессионные леггинсы",
        description: "Поддерживающие леггинсы для женщин",
        price: 3200,
        imageUrl: "https://images.unsplash.com/photo-1506629905877-c1e5027f5b6c",
        category: "clothing",
        sizes: ["XS", "S", "M", "L"],
        colors: ["Черный", "Фиолетовый"],
        isAvailable: true
      },
      {
        name: "Спортивные носки KAVARA",
        description: "Влагоотводящие носки для тренировок",
        price: 800,
        imageUrl: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b",
        category: "accessories",
        sizes: ["36-39", "40-43", "44-47"],
        colors: ["Белый", "Черный"],
        isAvailable: true
      },
      {
        name: "Спортивное полотенце",
        description: "Быстросохнущее полотенце для спортзала",
        price: 1200,
        imageUrl: "https://images.unsplash.com/photo-1584464491033-06628f3a6b7b",
        category: "accessories",
        sizes: ["Стандарт"],
        colors: ["Серый", "Синий"],
        isAvailable: true
      },
      {
        name: "Беговая футболка Ultra",
        description: "Ультралегкая футболка для бега",
        price: 2800,
        imageUrl: "https://images.unsplash.com/photo-1544966503-7cc5ac882d5a",
        category: "clothing",
        sizes: ["S", "M", "L", "XL"],
        colors: ["Неон", "Черный"],
        isAvailable: true
      },
      {
        name: "Перчатки для зала",
        description: "Защитные перчатки для силовых тренировок",
        price: 1500,
        imageUrl: "https://images.unsplash.com/photo-1517838277536-f5f99be501cd",
        category: "accessories",
        sizes: ["S", "M", "L"],
        colors: ["Черный"],
        isAvailable: true
      },
      {
        name: "Топ для йоги",
        description: "Удобный топ с поддержкой для йоги",
        price: 2200,
        imageUrl: "https://images.unsplash.com/photo-1544966503-7cc5ac882d5a",
        category: "clothing",
        sizes: ["XS", "S", "M", "L"],
        colors: ["Розовый", "Черный", "Белый"],
        isAvailable: true
      }
    ];

    for (const productData of products) {
      const product = productRepository.create(productData);
      await productRepository.save(product);
    }
    console.log("Products seeded successfully");
  }

  const boxes = [
    {
      name: "ФИТНЕС КОМПЛЕКТ",
      description: "Полный набор для тренировок в спортзале",
      price: 20,
      imageUrl: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b",
      contents: [
        "Спортивная футболка KAVARA",
        "Шорты для тренировок",
        "Спортивные носки",
        "Полотенце",
      ],
      category: "ready",
      emoji: "💪",
      isAvailable: true,
      sportTypes: ["Силовые тренировки"],
    },
    {
      name: "БЕГОВОЙ НАБОР",
      description: "Легкая и дышащая одежда для бега",
      price: 90,
      imageUrl: "https://images.unsplash.com/photo-1506629905877-c1e5027f5b6c",
      contents: ["Беговая футболка", "Беговые шорты", "Компрессионные гетры"],
      category: "ready",
      emoji: "🏃‍♂️",
      isAvailable: true,
      sportTypes: ["Бег/кардио"],
    },
    {
      name: "ЙОГА СТИЛЬ",
      description: "Комфортная одежда для йоги и растяжки",
      price: 20,
      imageUrl: "https://images.unsplash.com/photo-1544966503-7cc5ac882d5a",
      contents: ["Топ для йоги", "Леггинсы", "Коврик для йоги"],
      category: "ready",
      emoji: "🧘‍♀️",
      isAvailable: true,
      sportTypes: ["Йога/пилатес"],
    },
    {
      name: "ПРЕМИУМ СПОРТ",
      description: "Элитная коллекция для профессиональных спортсменов",
      price: 20,
      imageUrl: "https://images.unsplash.com/photo-1517838277536-f5f99be501cd",
      contents: [
        "Премиум футболка",
        "Компрессионные шорты",
        "Профессиональные аксессуары",
      ],
      category: "ready",
      emoji: "⭐",
      isAvailable: false,
    },
    {
      name: "ЗИМНИЙ СПОРТ",
      description: "Теплая спортивная одежда для холодного времени года",
      price: 20,
      imageUrl: "https://images.unsplash.com/photo-1594736797933-d0b22ce8cd6c",
      contents: ["Утепленная куртка", "Термобелье", "Зимние аксессуары"],
      category: "ready",
      emoji: "❄️",
      isAvailable: false,
    },
    // Personal boxes
    {
      name: "СИЛОВЫЕ ТРЕНИРОВКИ",
      description: "Комплект для тренировок с железом",
      price: 12000,
      imageUrl: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b",
      contents: [
        "Компрессионная футболка",
        "Шорты для тренировок",
        "Перчатки для зала",
      ],
      category: "personal",
      emoji: "🏋️‍♂️",
      isAvailable: true,
      sportTypes: ["Силовые тренировки"],
    },
    {
      name: "КАРДИО МИКС",
      description: "Легкая одежда для кардио тренировок",
      price: 8000,
      imageUrl: "https://images.unsplash.com/photo-1506629905877-c1e5027f5b6c",
      contents: ["Дышащая футболка", "Легкие шорты", "Спортивные кроссовки"],
      category: "personal",
      emoji: "🏃‍♀️",
      isAvailable: true,
      sportTypes: ["Бег/кардио"],
    },
    {
      name: "АКТИВНЫЙ СТИЛЬ",
      description: "Стильный комплект для бега и активного образа жизни",
      price: 17000,
      imageUrl: "https://images.unsplash.com/photo-1506629905877-c1e5027f5b6c",
      contents: ["Беговая футболка", "Спортивные шорты", "Беговые кроссовки"],
      category: "personal",
      emoji: "🏃‍♂️",
      isAvailable: true,
      sportTypes: ["Бег/кардио", "Повседневная носка"],
    },
    {
      name: "ПРЕМИУМ ФИТНЕС",
      description: "Профессиональный набор из премиальных материалов",
      price: 28000,
      imageUrl: "https://images.unsplash.com/photo-1544966503-7cc5ac882d5a",
      contents: [
        "Компрессионный топ",
        "Премиум леггинсы",
        "Профессиональные кроссовки",
      ],
      category: "personal",
      emoji: "⭐",
      isAvailable: true,
      sportTypes: ["Силовые тренировки", "Йога/пилатес"],
    },
    {
      name: "ЙОГА КОМФОРТ",
      description: "Мягкая и удобная одежда для йоги",
      price: 9500,
      imageUrl: "https://images.unsplash.com/photo-1544966503-7cc5ac882d5a",
      contents: [
        "Топ для йоги",
        "Удобные леггинсы",
        "Коврик для йоги",
      ],
      category: "personal",
      emoji: "🧘‍♀️",
      isAvailable: true,
      sportTypes: ["Йога/пилатес"],
    },
    {
      name: "ВЕЛОСИПЕДИСТ",
      description: "Специальная одежда для велоспорта",
      price: 14000,
      imageUrl: "https://images.unsplash.com/photo-1544966503-7cc5ac882d5a",
      contents: [
        "Велосипедная майка",
        "Велошорты с памперсом",
        "Велосипедные перчатки",
      ],
      category: "personal",
      emoji: "🚴‍♂️",
      isAvailable: true,
      sportTypes: ["Велоспорт"],
    },
    {
      name: "КОМАНДНЫЙ ИГРОК",
      description: "Универсальный набор для командных видов спорта",
      price: 11000,
      imageUrl: "https://images.unsplash.com/photo-1544966503-7cc5ac882d5a",
      contents: [
        "Спортивная футболка",
        "Игровые шорты",
        "Спортивные гетры",
      ],
      category: "personal",
      emoji: "🏀",
      isAvailable: true,
      sportTypes: ["Командные виды спорта"],
    },
    {
      name: "ПОВСЕДНЕВНЫЙ СПОРТ",
      description: "Стильная спортивная одежда для повседневной носки",
      price: 7500,
      imageUrl: "https://images.unsplash.com/photo-1544966503-7cc5ac882d5a",
      contents: [
        "Спортивная толстовка",
        "Удобные спортивные брюки",
        "Кроссовки для города",
      ],
      category: "personal",
      emoji: "🌟",
      isAvailable: true,
      sportTypes: ["Повседневная носка"],
    },
    {
      name: "МУЛЬТИСПОРТ",
      description: "Универсальный набор для разных видов активности",
      price: 18500,
      imageUrl: "https://images.unsplash.com/photo-1544966503-7cc5ac882d5a",
      contents: [
        "Многофункциональная футболка",
        "Универсальные шорты",
        "Спортивная обувь",
      ],
      category: "personal",
      emoji: "🎯",
      isAvailable: true,
      sportTypes: ["Бег/кардио", "Силовые тренировки", "Повседневная носка"],
    },
  ];

  await boxRepository.save(boxes);
  console.log("Database seeded with initial boxes using TypeORM");
}