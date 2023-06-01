import { Product } from './Product';
import { Bin } from '$src/domains/warehouse/models/Bin';

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  ManyToOne,
  Check,
  Relation,
  Unique,
} from 'typeorm';

@Entity()
@Unique(['bin', 'product'])
export class BinProduct {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => Bin, { nullable: false })
  bin!: Bin;

  @ManyToOne(() => Product, { nullable: false })
  product!: Relation<Product>;

  @Column({ type: 'int', default: 0 })
  @Check(`"quantity" >= 0`)
  quantity!: number;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @DeleteDateColumn()
  deletedAt?: Date;
}
