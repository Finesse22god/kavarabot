import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from "typeorm";
import { Box } from "./Box";
import { Product } from "./Product";

@Entity("box_products")
export class BoxProduct {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @CreateDateColumn()
  createdAt!: Date;

  @Column({ type: "varchar" })
  boxId!: string;

  @Column({ type: "varchar" })
  productId!: string;

  @Column({ type: "integer", default: 1 })
  quantity!: number;

  @ManyToOne(() => Box, (box) => box.boxProducts, { onDelete: "CASCADE" })
  @JoinColumn({ name: "boxId" })
  box!: Box;

  @ManyToOne(() => Product, (product) => product.boxProducts, { onDelete: "CASCADE" })
  @JoinColumn({ name: "productId" })
  product!: Product;
}