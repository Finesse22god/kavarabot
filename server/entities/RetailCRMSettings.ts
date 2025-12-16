import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from "typeorm";

@Entity("retailcrm_settings")
export class RetailCRMSettings {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "boolean", default: false })
  enabled!: boolean;

  @Column({ type: "varchar", length: 255, nullable: true })
  apiUrl?: string;

  @Column({ type: "varchar", length: 255, nullable: true })
  apiKey?: string;

  @Column({ type: "varchar", length: 100, nullable: true })
  siteCode?: string;

  @Column({ type: "integer", default: 0 })
  syncedOrdersCount!: number;

  @Column({ type: "integer", default: 0 })
  syncedCustomersCount!: number;

  @Column({ type: "timestamp", nullable: true })
  lastSyncAt?: Date;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
