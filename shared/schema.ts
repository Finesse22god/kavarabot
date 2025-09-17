import { pgTable, text, integer, timestamp, boolean, uuid, varchar } from "drizzle-orm/pg-core";
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
  userId: uuid("user_id").references(() => users.id).notNull(),
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
export const usersRelations = relations(users, ({ one }) => ({
  sizes: one(userSizes, {
    fields: [users.id],
    references: [userSizes.userId],
  }),
}));

export const userSizesRelations = relations(userSizes, ({ one }) => ({
  user: one(users, {
    fields: [userSizes.userId],
    references: [users.id],
  }),
}));