import { Product } from '$src/domains/product/models/Product';
import { Supplier } from '$src/domains/supplier/models/Supplier';
import { User } from '$src/domains/user/models/User';
import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Inbound } from './Inbound';
import { InboundProductSort } from './InboundProductSort';
import type { Relation } from 'typeorm';

@Entity()
export class InboundProduct {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => Inbound, (inbound) => inbound.products)
  inbound!: Relation<Inbound>;

  @ManyToOne(() => Supplier, { nullable: true })
  supplier!: Relation<Supplier> | null;

  @Column()
  quantity!: number;

  @Column({ nullable: true })
  actualQuantity!: number;

  @Column({ nullable: true })
  price!: number;

  @ManyToOne(() => Product)
  product!: Relation<Product>;

  @ManyToOne(() => User)
  creator!: User;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @DeleteDateColumn()
  deletedAt!: Date;

  @OneToMany(() => InboundProductSort, (sort) => sort.inboundProduct)
  sorts!: Relation<InboundProductSort[]>;
}
