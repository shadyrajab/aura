import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
} from "typeorm";
import { Event } from "./event";

@Entity()
export class Winner {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  discordId: string;

  @Column({ type: "float" })
  finalAura: number;

  @ManyToOne(() => Event)
  event: Event;

  @Column()
  eventId: number;

  @CreateDateColumn()
  createdAt: Date;
}
