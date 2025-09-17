import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from "typeorm";
import { User } from "./User";

@Entity("referrals")
export class Referral {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @CreateDateColumn()
  createdAt!: Date;

  @Column({ type: "varchar" })
  referrerId!: string;

  @Column({ type: "varchar" })
  referredId!: string;

  @Column({ 
    type: "enum", 
    enum: ["pending", "completed"],
    default: "pending"
  })
  status!: "pending" | "completed";

  @Column({ type: "boolean", default: false })
  bonusAwarded!: boolean;

  @ManyToOne(() => User, (user) => user.referrals)
  @JoinColumn({ name: "referrerId" })
  referrer!: User;

  @ManyToOne(() => User, (user) => user.referredBy_)
  @JoinColumn({ name: "referredId" })
  referred!: User;
}