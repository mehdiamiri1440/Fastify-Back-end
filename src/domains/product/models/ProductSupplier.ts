import { Supplier } from '$src/domains/supplier/models/Supplier';
import { User } from '$src/domains/user/models/User';
import { Product } from './Product';

import {
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
@Index(['supplier', 'product'], { where: `deleted_at IS NULL` })
export class ProductSupplier {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => Supplier, { nullable: false })
  supplier!: Relation<Supplier>;

  @ManyToOne(() => Product, { nullable: false })
  product!: Relation<Product>;

  @Column({ type: 'varchar', nullable: true })
  referenceCode?: string | null;

  @ManyToOne(() => User, { nullable: false })
  creator!: User;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @DeleteDateColumn()
  deletedAt?: Date;
}
