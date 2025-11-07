import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Unique,
} from "typeorm";
import { User } from "./User";
import { PromoCode } from "./PromoCode";
import { Order } from "./Order";

@Entity("promo_code_usages")
@Unique(["orderId"]) // Prevent duplicate awards for the same order
export class PromoCodeUsage {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "uuid" })
  promoCodeId!: string;

  @ManyToOne(() => PromoCode)
  @JoinColumn({ name: "promoCodeId" })
  promoCode!: PromoCode;

  @Column({ type: "uuid" })
  userId!: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: "userId" })
  user!: User;

  @Column({ type: "uuid", nullable: true })
  orderId?: string;

  @ManyToOne(() => Order, { nullable: true })
  @JoinColumn({ name: "orderId" })
  order?: Order;

  @Column({ type: "int", default: 0 })
  pointsAwarded!: number;

  @Column({ type: "decimal", precision: 10, scale: 2 })
  orderAmount!: number;

  @Column({ type: "decimal", precision: 10, scale: 2 })
  discountAmount!: number;

  @CreateDateColumn()
  createdAt!: Date;
}
