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

  @Column({ default: false })
  supplied!: boolean;

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
