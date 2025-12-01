import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn } from "typeorm";

export type BroadcastStatus = 'draft' | 'sending' | 'sent' | 'failed';

export interface BroadcastButton {
  label: string;
  startAppParam: string;
}

@Entity("broadcasts")
export class Broadcast {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @CreateDateColumn()
  createdAt!: Date;

  @Column({ type: "varchar", length: 255 })
  title!: string;

  @Column({ type: "text" })
  message!: string;

  @Column({ type: "text", nullable: true })
  imageUrl!: string | null;

  @Column({ type: "jsonb", default: [] })
  buttons!: BroadcastButton[];

  @Column({ 
    type: "enum", 
    enum: ['draft', 'sending', 'sent', 'failed'],
    default: 'draft'
  })
  status!: BroadcastStatus;

  @Column({ type: "int", default: 0 })
  sentCount!: number;

  @Column({ type: "int", default: 0 })
  failedCount!: number;

  @Column({ type: "int", default: 0 })
  totalRecipients!: number;

  @Column({ type: "timestamp", nullable: true })
  sentAt!: Date | null;

  @Column({ type: "text", nullable: true })
  errorMessage!: string | null;
}
