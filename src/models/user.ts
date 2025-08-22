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

  @Column()
  aura: number;

  @UpdateDateColumn()
  updatedAt: Date | null;

  @Column({ type: "int", default: 0 })
  position: number;
}
