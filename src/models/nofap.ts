import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";

@Entity()
export class NoFap {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  discordId: string;

  @Column({ type: "int", default: 0 })
  currentStreak: number;

  @Column({ type: "int", default: 0 })
  bestStreak: number;

  @Column({ type: "date", nullable: true })
  lastCheckIn: Date | null;

  @Column({ type: "boolean", default: true })
  isActive: boolean;

  @Column({ type: "boolean", default: false })
  hasFailed: boolean;

  @Column({ type: "date", nullable: true })
  streakStartDate: Date | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
