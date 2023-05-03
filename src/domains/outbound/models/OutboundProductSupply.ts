import { Product } from '$src/domains/product/models/Product';
import { User } from '$src/domains/user/models/User';
import type { Relation } from 'typeorm';
import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { OutboundProduct } from './OutboundProduct';
import { Bin } from '$src/domains/warehouse/models/Bin';

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

  @DeleteDateColumn()
  deletedAt!: Date;
}
