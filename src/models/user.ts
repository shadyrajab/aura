import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  discordId: string;

  @Column({ type: "float", default: 0 })
  aura: number;

  @UpdateDateColumn()
  updatedAt: Date | null;

  @Column({ type: "timestamp", nullable: true })
  lastChargeDate: Date | null;
}
