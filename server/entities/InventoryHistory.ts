import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from "typeorm";
import { Product } from "./Product";
import { Box } from "./Box";
import { Order } from "./Order";

@Entity("inventory_history")
export class InventoryHistory {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @CreateDateColumn()
  createdAt!: Date;

  // Связь с продуктом или боксом
  @Column({ type: "uuid", nullable: true })
  productId?: string;

  @ManyToOne(() => Product, { nullable: true })
  @JoinColumn({ name: "productId" })
  product?: Product;

  @Column({ type: "uuid", nullable: true })
  boxId?: string;

  @ManyToOne(() => Box, { nullable: true })
  @JoinColumn({ name: "boxId" })
  box?: Box;

  // Размер товара
  @Column({ type: "varchar", nullable: true })
  size?: string;

  // Тип операции: 'add' (добавление), 'sale' (продажа), 'correction' (корректировка)
  @Column({ type: "varchar" })
  type!: 'add' | 'sale' | 'correction';

  // Количество изменения (положительное для добавления, отрицательное для продажи)
  @Column({ type: "integer" })
  quantity!: number;

  // Остаток после изменения
  @Column({ type: "integer" })
  balanceAfter!: number;

  // Связь с заказом (если это продажа)
  @Column({ type: "uuid", nullable: true })
  orderId?: string;

  @ManyToOne(() => Order, { nullable: true })
  @JoinColumn({ name: "orderId" })
  order?: Order;

  // Примечание
  @Column({ type: "text", nullable: true })
  note?: string;
}
