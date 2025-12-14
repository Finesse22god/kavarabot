import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from "typeorm";

@Entity("reminder_settings")
export class ReminderSettings {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "varchar", length: 50 })
  type!: string; // "abandoned_cart" | "unpaid_order"

  @Column({ type: "boolean", default: false })
  enabled!: boolean;

  @Column({ type: "integer", default: 2 })
  delayHours!: number;

  @Column({ type: "text" })
  messageTemplate!: string;

  @Column({ type: "integer", default: 0 })
  sentCount!: number;

  @Column({ type: "integer", default: 0 })
  convertedCount!: number;

  @Column({ type: "integer", default: 3 })
  maxReminders!: number; // Maximum reminders per user/order

  @Column({ type: "integer", default: 24 })
  minIntervalHours!: number; // Minimum hours between reminders

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
