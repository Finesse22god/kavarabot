import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from "typeorm";
import { User } from "./User";
import { Box } from "./Box";
import { Product } from "./Product";

@Entity("cart")
export class Cart {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @CreateDateColumn()
  createdAt!: Date;

  @Column({ type: "varchar" })
  userId!: string;

  @Column({ type: "varchar", nullable: true })
  boxId?: string;

  @Column({ type: "varchar", nullable: true })
  productId?: string;

  @Column({ type: "varchar" })
  itemType!: string; // "box" or "product"

  @Column({ type: "integer", default: 1 })
  quantity!: number;

  @Column({ type: "varchar", nullable: true })
  selectedSize?: string;

  @ManyToOne(() => User, { onDelete: "CASCADE" })
  @JoinColumn({ name: "userId" })
  user!: User;

  @ManyToOne(() => Box, { onDelete: "CASCADE" })
  @JoinColumn({ name: "boxId" })
  box?: Box;

  @ManyToOne(() => Product, { onDelete: "CASCADE" })
  @JoinColumn({ name: "productId" })
  product?: Product;
}