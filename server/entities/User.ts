import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, OneToMany } from "typeorm";
import { QuizResponse } from "./QuizResponse";
import { Order } from "./Order";
import { Notification } from "./Notification";
import { LoyaltyTransaction } from "./LoyaltyTransaction";
import { Referral } from "./Referral";

@Entity("users")
export class User {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @CreateDateColumn()
  createdAt!: Date;

  @Column({ type: "varchar", nullable: true, unique: true })
  telegramId?: string;

  @Column({ type: "varchar", nullable: true })
  username?: string;

  @Column({ type: "varchar", nullable: true })
  firstName?: string;

  @Column({ type: "varchar", nullable: true })
  lastName?: string;

  @Column({ type: "int", default: 0 })
  loyaltyPoints!: number;

  @Column({ type: "varchar", nullable: true, unique: true })
  referralCode?: string;

  @Column({ type: "varchar", nullable: true })
  referredBy?: string;

  // Body measurements for size recommendations
  @Column({ type: "varchar", nullable: true })
  height?: string;

  @Column({ type: "varchar", nullable: true })
  weight?: string;

  @Column({ type: "varchar", nullable: true })
  sleeveLength?: string;

  @Column({ type: "varchar", nullable: true })
  chestSize?: string;

  @Column({ type: "varchar", nullable: true })
  waistSize?: string;

  @Column({ type: "varchar", nullable: true })
  hipSize?: string;

  @Column({ type: "varchar", nullable: true })
  preferredSize?: string;

  @Column({ type: "boolean", default: false })
  packageBonusActivated!: boolean;

  @OneToMany(() => QuizResponse, (response) => response.user)
  quizResponses!: QuizResponse[];

  @OneToMany(() => Order, (order) => order.user)
  orders!: Order[];

  @OneToMany(() => Notification, (notification) => notification.user)
  notifications!: Notification[];

  @OneToMany(() => LoyaltyTransaction, (transaction: LoyaltyTransaction) => transaction.user)
  loyaltyTransactions!: LoyaltyTransaction[];

  @OneToMany(() => Referral, (referral: Referral) => referral.referrer)
  referrals!: Referral[];

  @OneToMany(() => Referral, (referral: Referral) => referral.referred)
  referredBy_!: Referral[];
}