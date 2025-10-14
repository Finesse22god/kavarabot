import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from "typeorm";

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

  @Column({ type: "varchar", nullable: true })
  telegramUsername?: string;

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

  @ManyToOne("User", (user: any) => user.orders, { onDelete: "SET NULL" })
  @JoinColumn({ name: "userId" })
  user?: any;

  @ManyToOne("Box", (box: any) => box.orders, { onDelete: "SET NULL" })
  @JoinColumn({ name: "boxId" })
  box?: any;

  @ManyToOne("Product", (product: any) => product.orders, { onDelete: "SET NULL" })
  @JoinColumn({ name: "productId" })
  product?: any;

  @ManyToOne("Trainer", (trainer: any) => trainer.orders, { onDelete: "SET NULL" })
  @JoinColumn({ name: "trainerId" })
  trainer?: any;

  @ManyToOne("PromoCode", (promoCode: any) => promoCode.orders, { onDelete: "SET NULL" })
  @JoinColumn({ name: "promoCodeId" })
  promoCode?: any;
}