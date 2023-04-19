import { Category } from '$src/domains/configuration/models/Category';
import { Color } from '$src/domains/configuration/models/Color';
import { Size } from './Size';
import { Brand } from '$src/domains/configuration/models/Brand';
import { Unit } from '$src/domains/configuration/models/Unit';
import { TaxType } from './TaxType';
import { User } from '$src/domains/user/models/User';
import { ProductSalePrice } from './ProductSalePrice';
import { Static } from '@sinclair/typebox';
import { ProductSchema } from '../schemas/product.schema';

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  Relation,
} from 'typeorm';

@Entity()
export class Product implements Static<typeof ProductSchema> {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  name!: string;

  @Column({ default: 0 })
  basicQuantity!: number;

  @Column({ default: 0 })
  quantity!: number;

  @Column({ nullable: true })
  barcode!: string;

  @Column({ nullable: true })
  invoiceSystemCode!: number;

  @Column({ nullable: true })
  description!: string;

  @Column({ nullable: true })
  weight!: number;

  @ManyToOne(() => TaxType)
  taxType!: Relation<TaxType>;

  @ManyToOne(() => Size)
  size!: Relation<Size>;

  @ManyToOne(() => Unit)
  unit!: Relation<Unit>;

  @ManyToOne(() => Brand)
  brand!: Relation<Brand>;

  @ManyToOne(() => Color)
  color!: Relation<Color>;

  @ManyToOne(() => Category, (category) => category.id)
  category!: Relation<Category>;

  @ManyToOne(() => User)
  creator!: Relation<User>;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @DeleteDateColumn()
  deletedAt!: Date;

  @OneToMany(() => ProductSalePrice, (salePrice) => salePrice.product)
  salePrices!: ProductSalePrice[];
}
