import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from "typeorm";
import { User } from "./User";

@Entity("tryon_history")
export class TryonHistory {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @CreateDateColumn()
  createdAt!: Date;

  @Column({ type: "uuid", nullable: true })
  userId?: string;

  @ManyToOne(() => User, { nullable: true, onDelete: "SET NULL" })
  @JoinColumn({ name: "userId" })
  user?: User;

  @Column({ type: "varchar" })
  predictionId!: string;

  @Column({ type: "varchar", nullable: true })
  productId?: string;

  @Column({ type: "varchar", nullable: true })
  productName?: string;

  @Column({ type: "varchar", nullable: true })
  productImageUrl?: string;

  @Column({ type: "varchar", nullable: true })
  resultUrl?: string;

  @Column({ type: "varchar", default: "upper_body" })
  category!: string;
}
