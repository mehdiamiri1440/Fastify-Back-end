import { User } from '$src/domains/user/models/User';
import { Bin } from '$src/domains/warehouse/models/Bin';
import type { Relation } from 'typeorm';
import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { OutboundProduct } from './OutboundProduct';

@Entity()
export class OutboundProductSupply {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => OutboundProduct, (outbound) => outbound.product)
  outboundProduct!: Relation<OutboundProduct>;

  @ManyToOne(() => Bin)
  bin!: Relation<Bin>;

  @Column()
  quantity!: number;

  @ManyToOne(() => User)
  creator!: User;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
