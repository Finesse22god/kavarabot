import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from "typeorm";
import { User } from "./User";
import { Order } from "./Order";

@Entity("loyalty_transactions")
export class LoyaltyTransaction {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @CreateDateColumn()
  createdAt!: Date;

  @Column({ type: "varchar" })
  userId!: string;

  @Column({ type: "varchar", nullable: true })
  orderId?: string;

  @Column({ 
    type: "enum", 
    enum: ["earn", "spend", "referral_bonus", "referral_reward"]
  })
  type!: "earn" | "spend" | "referral_bonus" | "referral_reward";

  @Column({ type: "int" })
  points!: number;

  @Column({ type: "text" })
  description!: string;

  @ManyToOne(() => User, (user) => user.loyaltyTransactions)
  @JoinColumn({ name: "userId" })
  user!: User;

  @ManyToOne(() => Order, { nullable: true })
  @JoinColumn({ name: "orderId" })
  order?: Order;
}