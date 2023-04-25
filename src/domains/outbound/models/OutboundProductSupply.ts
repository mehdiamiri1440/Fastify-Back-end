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

@Entity()
export class OutboundProductSupply {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => OutboundProduct, (outbound) => outbound.product)
  outboundProduct!: Relation<OutboundProduct>;

  @ManyToOne(() => Product)
  product!: Relation<Product>;

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
