import { Bin } from '$src/domains/warehouse/models/Bin';
import { Product } from './Product';

import {
  Check,
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  ManyToOne,
  PrimaryGeneratedColumn,
  Relation,
  UpdateDateColumn,
} from 'typeorm';

@Entity()
@Index(['bin', 'product'], { where: `deleted_at IS NULL` })
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
