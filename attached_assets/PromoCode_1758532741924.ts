import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from "typeorm";
import { Trainer } from "./Trainer";
import { Order } from "./Order";

export enum PromoCodeType {
  TRAINER = 'trainer',
  GENERAL = 'general',
  LOYALTY_DISCOUNT = 'loyalty_discount'
}

@Entity("promo_codes")
export class PromoCode {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "varchar", unique: true })
  code!: string;

  @Column({
    type: "enum",
    enum: PromoCodeType,
    default: PromoCodeType.GENERAL
  })
  type!: PromoCodeType;

  @Column({ type: "decimal", precision: 5, scale: 2 })
  discountPercent!: number;

  @Column({ type: "int", nullable: true })
  discountAmount?: number;

  @Column({ type: "boolean", default: true })
  isActive!: boolean;

  @Column({ type: "int", nullable: true })
  maxUses?: number;

  @Column({ type: "int", default: 0 })
  usedCount!: number;

  @Column({ type: "timestamp", nullable: true })
  expiresAt?: Date;

  @Column({ type: "uuid", nullable: true })
  trainerId?: string;

  @ManyToOne(() => Trainer, trainer => trainer.orders, { nullable: true })
  @JoinColumn({ name: "trainerId" })
  trainer?: Trainer;

  @OneToMany(() => Order, order => order.promoCode)
  orders!: Order[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}