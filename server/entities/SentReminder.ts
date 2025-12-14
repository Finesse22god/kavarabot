import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from "typeorm";
import { User } from "./User";

@Entity("sent_reminders")
export class SentReminder {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "varchar" })
  userId!: string;

  @Column({ type: "varchar", length: 50 })
  type!: string; // "abandoned_cart" | "unpaid_order"

  @Column({ type: "varchar", nullable: true })
  orderId?: string;

  @Column({ type: "boolean", default: false })
  converted!: boolean;

  @CreateDateColumn()
  sentAt!: Date;

  @Column({ type: "timestamp", nullable: true })
  convertedAt?: Date;

  @ManyToOne(() => User, { onDelete: "CASCADE" })
  @JoinColumn({ name: "userId" })
  user!: User;
}
