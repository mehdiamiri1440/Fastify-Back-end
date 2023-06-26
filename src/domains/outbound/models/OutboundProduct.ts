import { Product } from '$src/domains/product/models/Product';
import { User } from '$src/domains/user/models/User';
import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  Relation,
  UpdateDateColumn,
} from 'typeorm';
import { Outbound } from './Outbound';
import { OutboundProductSupply } from './OutboundProductSupply';

export enum ProductSupplyState {
  PENDING = 'pending',
  SUBMITTED = 'submitted',
  APPLIED = 'applied',
}

@Entity()
export class OutboundProduct {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => Outbound, (outbound) => outbound.products)
  outbound!: Relation<Outbound>;

  @Column({ type: 'integer' })
  quantity!: number;

  @ManyToOne(() => Product)
  product!: Relation<Product>;

  @Column({
    type: 'enum',
    enum: ProductSupplyState,
    default: ProductSupplyState.PENDING,
  })
  supplyState!: 'pending' | 'submitted' | 'applied';

  @ManyToOne(() => User)
  creator!: User;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @DeleteDateColumn()
  deletedAt!: Date;

  @OneToMany(() => OutboundProductSupply, (product) => product.outboundProduct)
  supplies!: Relation<OutboundProductSupply[]>;
}
