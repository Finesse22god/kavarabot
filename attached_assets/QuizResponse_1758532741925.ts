import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from "typeorm";
import { User } from "./User";

@Entity("quiz_responses")
export class QuizResponse {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @CreateDateColumn()
  createdAt!: Date;

  @Column({ type: "uuid", nullable: true })
  userId?: string;

  @Column({ type: "varchar", nullable: true })
  size?: string;

  @Column({ type: "varchar", nullable: true })
  height?: string;

  @Column({ type: "varchar", nullable: true })
  weight?: string;

  @Column({ type: "simple-array", nullable: true })
  goals?: string[];

  @Column({ type: "varchar", nullable: true })
  budget?: string;

  @ManyToOne(() => User, (user) => user.quizResponses, { onDelete: "CASCADE" })
  @JoinColumn({ name: "userId" })
  user!: User;
}