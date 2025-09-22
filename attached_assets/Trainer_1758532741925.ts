import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from "typeorm";
import { Order } from "./Order";

@Entity("trainers")
export class Trainer {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "varchar", unique: true })
  email!: string;

  @Column({ type: "varchar" })
  name!: string;

  @Column({ type: "varchar", nullable: true })
  phone?: string;

  @Column({ type: "varchar", nullable: true })
  gym?: string;

  @Column({ type: "varchar", unique: true })
  promoCode!: string;

  @Column({ type: "decimal", precision: 5, scale: 2, default: 15 })
  discountPercent!: number;

  @Column({ type: "decimal", precision: 5, scale: 2, default: 10 })
  commissionPercent!: number;

  @Column({ type: "boolean", default: true })
  isActive!: boolean;

  @Column({ type: "int", default: 0 })
  totalOrders!: number;

  @Column({ type: "decimal", precision: 10, scale: 2, default: 0 })
  totalEarnings!: number;

  @OneToMany(() => Order, order => order.trainer)
  orders!: Order[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}