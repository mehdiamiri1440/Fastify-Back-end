import { Supplier } from '$src/domains/supplier/models/Supplier';
import { Product } from '../../product/models/Product';
import { User } from '$src/domains/user/models/User';

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  ManyToOne,
} from 'typeorm';

@Entity()
export class SupplierProduct {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => Supplier, { nullable: false })
  supplier!: Supplier;

  @ManyToOne(() => Product, { nullable: false })
  product!: Product;

  @Column({ type: 'int' })
  reference_code!: number;

  @ManyToOne(() => User, { nullable: false })
  creator!: User;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @DeleteDateColumn()
  deletedAt?: Date;
}
