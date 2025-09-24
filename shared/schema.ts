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
  orderNumber: varchar("order_number", { length: 100 }).unique().notNull(),
  userId: uuid("user_id"),
  customerName: varchar("customer_name", { length: 255 }),
  customerPhone: varchar("customer_phone", { length: 50 }),
  customerEmail: varchar("customer_email", { length: 255 }),
  totalPrice: decimal("total_price", { precision: 10, scale: 2 }).notNull(),
  status: varchar("status", { length: 50 }).default("pending"),
  deliveryMethod: varchar("delivery_method", { length: 50 }),
  deliveryAddress: text("delivery_address"),
  paymentMethod: varchar("payment_method", { length: 50 }),
  paymentId: varchar("payment_id", { length: 255 }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Additional types
export type Box = typeof boxes.$inferSelect;
export type InsertBox = typeof boxes.$inferInsert;
export type QuizResponse = typeof quizResponses.$inferSelect;
export type InsertQuizResponse = typeof quizResponses.$inferInsert;
export type Order = typeof orders.$inferSelect;
export type InsertOrder = typeof orders.$inferInsert;