import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, OneToMany } from "typeorm";
import { Order } from "./Order";
import { Notification } from "./Notification";
import { BoxProduct } from "./BoxProduct";

@Entity("boxes")
export class Box {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @CreateDateColumn()
  createdAt!: Date;

  @Column({ type: "varchar" })
  name!: string;

  @Column({ type: "text", nullable: true })
  description?: string;

  @Column({ type: "integer" })
  price!: number;

  @Column({ type: "varchar", nullable: true })
  imageUrl?: string;

  @Column({ type: "varchar", nullable: true })
  photoUrl?: string;

  @Column({ type: "simple-array", nullable: true })
  contents?: string[];

  @Column({ type: "varchar", nullable: true })
  category?: string;

  @Column({ type: "varchar", nullable: true })
  emoji?: string;

  @Column({ type: "boolean", default: true })
  isAvailable!: boolean;

  @Column({ type: "boolean", default: false })
  isQuizOnly!: boolean;

  @Column({ type: "simple-array", nullable: true })
  sportTypes?: string[];

  @Column({ type: "simple-array", nullable: true })
  availableTopSizes?: string[];

  @Column({ type: "simple-array", nullable: true })
  availableBottomSizes?: string[];

  @Column({ type: "jsonb", nullable: true })
  inventory?: Record<string, number> | null;

  @OneToMany(() => Order, (order) => order.box)
  orders!: Order[];

  @OneToMany(() => Notification, (notification) => notification.box)
  notifications!: Notification[];

  @OneToMany(() => BoxProduct, (boxProduct) => boxProduct.box)
  boxProducts!: BoxProduct[];
}