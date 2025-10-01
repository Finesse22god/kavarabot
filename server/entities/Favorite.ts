import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from "typeorm";
import { User } from "./User";
import { Box } from "./Box";
import { Product } from "./Product";

@Entity("favorites")
export class Favorite {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @CreateDateColumn()
  createdAt!: Date;

  @Column({ type: "varchar" })
  userId!: string;

  @Column({ type: "varchar", nullable: true })
  boxId!: string | null;

  @Column({ type: "varchar", nullable: true })
  productId!: string | null;

  @ManyToOne(() => User, { onDelete: "CASCADE" })
  @JoinColumn({ name: "userId" })
  user!: User;

  @ManyToOne(() => Box, { nullable: true, onDelete: "CASCADE" })
  @JoinColumn({ name: "boxId" })
  box!: Box | null;

  @ManyToOne(() => Product, { nullable: true, onDelete: "CASCADE" })
  @JoinColumn({ name: "productId" })
  product!: Product | null;
}