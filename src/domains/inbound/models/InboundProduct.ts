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

export enum ProductSortState {
  PENDING = 'pending',
  SUBMITTED = 'submitted',
  APPLIED = 'applied',
}

@Entity()
export class InboundProduct {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => Inbound, (inbound) => inbound.products)
  inbound!: Relation<Inbound>;

  @ManyToOne(() => Supplier, { nullable: true })
  supplier!: Relation<Supplier> | null;

  @Column({ type: 'integer' })
  requestedQuantity!: number;

  @Column({ type: 'integer', nullable: true })
  actualQuantity!: number | number;

  @Column({
    type: 'enum',
    enum: ProductSortState,
    default: ProductSortState.PENDING,
  })
  sortState!: 'pending' | 'submitted' | 'applied';

  @Column('decimal', { precision: 18, scale: 2, nullable: true })
  price!: string;

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
