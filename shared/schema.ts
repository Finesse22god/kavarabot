import { pgTable, text, integer, timestamp, boolean, uuid, varchar, json, decimal } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// Users table
export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  telegramId: varchar("telegram_id", { length: 255 }).unique(),
  username: varchar("username", { length: 255 }),
  firstName: varchar("first_name", { length: 255 }),
  lastName: varchar("last_name", { length: 255 }),
  phone: varchar("phone", { length: 50 }),
  email: varchar("email", { length: 255 }),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// User size profiles table
export const userSizes = pgTable("user_sizes", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id, { onDelete: 'cascade' }).notNull(),
  height: integer("height"),
  weight: integer("weight"),
  chestSize: varchar("chest_size", { length: 10 }),
  waistSize: varchar("waist_size", { length: 10 }),
  shoeSize: varchar("shoe_size", { length: 10 }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Basic types for TypeScript
export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type UserSize = typeof userSizes.$inferSelect;
export type InsertUserSize = typeof userSizes.$inferInsert;

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  sizes: many(userSizes),
}));

export const userSizesRelations = relations(userSizes, ({ one }) => ({
  user: one(users, {
    fields: [userSizes.userId],
    references: [users.id],
  }),
}));

// Boxes table
export const boxes = pgTable("boxes", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  originalPrice: decimal("original_price", { precision: 10, scale: 2 }),
  imageUrl: text("image_url"),
  category: varchar("category", { length: 50 }),
  isAvailable: boolean("is_available").default(true),
  isQuizOnly: boolean("is_quiz_only").default(false),
  contents: json("contents").$type<string[]>(),
  sportTypes: json("sport_types").$type<string[]>(),
  availableSizes: json("available_sizes").$type<string[]>(),
  rating: decimal("rating", { precision: 3, scale: 2 }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Quiz responses table
export const quizResponses = pgTable("quiz_responses", {
  id: uuid("id").primaryKey().defaultRandom(),
  telegramId: varchar("telegram_id", { length: 255 }).notNull(),
  firstName: varchar("first_name", { length: 255 }),
  lastName: varchar("last_name", { length: 255 }),
  username: varchar("username", { length: 255 }),
  age: integer("age"),
  height: integer("height"),
  weight: integer("weight"),
  size: varchar("size", { length: 10 }),
  fitnessLevel: varchar("fitness_level", { length: 50 }),
  goals: json("goals").$type<string[]>(),
  budget: decimal("budget", { precision: 10, scale: 2 }),
  preferredStyle: varchar("preferred_style", { length: 100 }),
  sportTypes: json("sport_types").$type<string[]>(),
  experiences: json("experiences").$type<string[]>(),
  availableTime: varchar("available_time", { length: 50 }),
  preferredBrands: json("preferred_brands").$type<string[]>(),
  colorPreferences: json("color_preferences").$type<string[]>(),
  bodyType: varchar("body_type", { length: 50 }),
  activityFrequency: varchar("activity_frequency", { length: 50 }),
  weatherPreference: varchar("weather_preference", { length: 50 }),
  lifestyleFactors: json("lifestyle_factors").$type<string[]>(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Orders table
export const orders = pgTable("orders", {
  id: uuid("id").primaryKey().defaultRandom(),
  orderNumber: varchar("orderNumber", { length: 100 }).unique().notNull(),
  userId: uuid("userId"),
  boxId: uuid("boxId").references(() => boxes.id),
  productId: uuid("productId").references(() => products.id),
  customerName: varchar("customerName", { length: 255 }).notNull(),
  customerPhone: varchar("customerPhone", { length: 50 }).notNull(),
  customerEmail: varchar("customerEmail", { length: 255 }),
  telegramUsername: varchar("telegramUsername", { length: 255 }),
  deliveryMethod: varchar("deliveryMethod", { length: 50 }).notNull(),
  paymentMethod: varchar("paymentMethod", { length: 50 }).notNull(),
  totalPrice: integer("totalPrice").notNull(),
  status: varchar("status", { length: 50 }).notNull().default("pending"),
  paymentId: varchar("paymentId", { length: 255 }),
  promoCodeId: uuid("promoCodeId"),
  trainerId: uuid("trainerId"),
  discountPercent: decimal("discountPercent", { precision: 5, scale: 2 }).default('0').notNull(),
  discountAmount: integer("discountAmount").default(0).notNull(),
  loyaltyPointsUsed: integer("loyaltyPointsUsed").default(0).notNull(),
  selectedSize: varchar("selectedSize", { length: 50 }),
  cartItems: text("cartItems"),
  createdAt: timestamp("createdAt").defaultNow(),
});

// Products table
export const products = pgTable("products", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  price: integer("price").notNull(),
  imageUrl: text("image_url"),
  images: json("images").$type<string[]>(),
  category: varchar("category", { length: 100 }),
  brand: varchar("brand", { length: 100 }),
  color: varchar("color", { length: 50 }),
  sizes: json("sizes").$type<string[]>(),
  isAvailable: boolean("is_available").default(true),
  sportTypes: json("sport_types").$type<string[]>(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Additional types
export type Box = typeof boxes.$inferSelect;
export type Product = typeof products.$inferSelect;
export type InsertBox = typeof boxes.$inferInsert;
export type QuizResponse = typeof quizResponses.$inferSelect;
export type InsertQuizResponse = typeof quizResponses.$inferInsert;
export type Order = typeof orders.$inferSelect;
export type InsertOrder = typeof orders.$inferInsert;