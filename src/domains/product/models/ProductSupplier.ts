import { Supplier } from '$src/domains/supplier/models/Supplier';
import { Product } from './Product';
import { User } from '$src/domains/user/models/User';

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  ManyToOne,
  Relation,
} from 'typeorm';

@Entity()
export class SupplierProduct {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => Supplier, { nullable: false })
  supplier!: Relation<Supplier>;

  @ManyToOne(() => Product, { nullable: false })
  product!: Relation<Product>;

  @Column()
  referenceCode!: string;

  @ManyToOne(() => User, { nullable: false })
  creator!: User;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @DeleteDateColumn()
  deletedAt?: Date;
}
