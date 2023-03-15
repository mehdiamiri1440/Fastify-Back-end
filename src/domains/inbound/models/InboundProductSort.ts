import { User } from '$src/domains/user/models/User';
import { Bin } from '$src/domains/warehouse/models/Bin';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
} from 'typeorm';
import { InboundProduct } from './InboundProduct';
import type { Relation } from 'typeorm';

@Entity()
export class InboundProductSort {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => InboundProduct, (product) => product.sorts)
  inboundProduct!: Relation<InboundProduct>;

  @ManyToOne(() => Bin)
  bin!: Bin;

  @Column()
  quantity!: number;

  @ManyToOne(() => User)
  creator!: User;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @DeleteDateColumn()
  deletedAt!: Date;
}
