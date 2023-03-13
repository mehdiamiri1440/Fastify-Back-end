import { User } from '$src/domains/user/models/User.js';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
} from 'typeorm';
import type { Relation } from 'typeorm';
import { Inbound } from './Inbound.js';

@Entity()
export class InboundImage {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => Inbound, (inbound) => inbound.images)
  inbound!: Relation<Inbound>;

  @Column()
  fileId!: string;

  @ManyToOne(() => User)
  creator!: User;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @DeleteDateColumn()
  deletedAt!: Date;
}
