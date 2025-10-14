import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, OneToMany } from "typeorm";
import { BoxProduct } from "./BoxProduct";
import { Order } from "./Order";

@Entity("products")
export class Product {
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

  @Column({ type: "json", nullable: true })
  images?: string[];

  @Column({ type: "varchar", nullable: true })
  category?: string;

  @Column({ type: "varchar", nullable: true })
  brand?: string;

  @Column({ type: "varchar", nullable: true })
  color?: string;

  @Column({ type: "json", nullable: true })
  sizes?: string[];

  @Column({ type: "boolean", default: true })
  isAvailable!: boolean;

  @Column({ type: "json", nullable: true })
  sportTypes?: string[];

  @OneToMany(() => BoxProduct, (boxProduct) => boxProduct.product)
  boxProducts!: BoxProduct[];

  @OneToMany(() => Order, (order) => order.product)
  orders!: Order[];
}