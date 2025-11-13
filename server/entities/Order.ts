import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from "typeorm";
import { User } from "./User";
import { Box } from "./Box";
import { Product } from "./Product";
import { Trainer } from "./Trainer";
import { PromoCode } from "./PromoCode";

@Entity("orders")
export class Order {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "varchar", unique: true })
  orderNumber!: string;

  @CreateDateColumn()
  createdAt!: Date;

  @Column({ type: "uuid", nullable: true })
  userId?: string;

  @Column({ type: "uuid", nullable: true })
  boxId?: string;

  @Column({ type: "uuid", nullable: true })
  productId?: string;

  @Column({ type: "varchar" })
  customerName!: string;

  @Column({ type: "varchar" })
  customerPhone!: string;

  @Column({ type: "varchar", nullable: true })
  customerEmail?: string;

  @Column({ type: "varchar" })
  deliveryMethod!: string;

  @Column({ type: "varchar" })
  paymentMethod!: string;

  @Column({ type: "integer" })
  totalPrice!: number;

  @Column({ type: "varchar", default: "pending" })
  status!: string;

  @Column({ type: "varchar", nullable: true })
  paymentId?: string;

  @Column({ type: "uuid", nullable: true })
  promoCodeId?: string;

  @Column({ type: "uuid", nullable: true })
  trainerId?: string;

  @Column({ type: "decimal", precision: 5, scale: 2, default: 0 })
  discountPercent!: number;

  @Column({ type: "integer", default: 0 })
  discountAmount!: number;

  @Column({ type: "integer", default: 0 })
  loyaltyPointsUsed!: number;

  @Column({ type: "varchar", nullable: true })
  selectedSize?: string;

  @Column({ type: "text", nullable: true })
  cartItems?: string; // JSON string of cart items for combined orders

  @ManyToOne(() => User, (user) => user.orders, { onDelete: "SET NULL" })
  @JoinColumn({ name: "userId" })
  user!: User;

  @ManyToOne(() => Box, (box) => box.orders, { onDelete: "SET NULL" })
  @JoinColumn({ name: "boxId" })
  box!: Box;

  @ManyToOne(() => Product, { onDelete: "SET NULL" })
  @JoinColumn({ name: "productId" })
  product?: Product;

  @ManyToOne(() => Trainer, (trainer) => trainer.orders, { onDelete: "SET NULL" })
  @JoinColumn({ name: "trainerId" })
  trainer?: Trainer;

  @ManyToOne(() => PromoCode, (promoCode) => promoCode.orders, { onDelete: "SET NULL" })
  @JoinColumn({ name: "promoCodeId" })
  promoCode?: PromoCode;
}