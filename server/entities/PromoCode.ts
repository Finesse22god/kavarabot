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
import { User } from "./User";

export enum PromoCodeType {
  TRAINER = 'trainer',
  GENERAL = 'general',
  LOYALTY_DISCOUNT = 'loyalty_discount',
  REFERRAL = 'referral'
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

  @Column({ type: "uuid", nullable: true })
  ownerId?: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: "ownerId" })
  owner?: User;

  @Column({ type: "int", default: 0 })
  pointsPerUse!: number;

  @Column({ type: "decimal", precision: 5, scale: 2, default: 0 })
  rewardPercent!: number;

  @Column({ type: "varchar", nullable: true })
  partnerName?: string;

  @Column({ type: "varchar", nullable: true })
  partnerContact?: string;

  @OneToMany(() => Order, order => order.promoCode)
  orders!: Order[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}