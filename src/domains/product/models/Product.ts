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
import { SupplierProduct } from '$src/domains/product/models/ProductSupplier';

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
  Check,
  JoinTable,
  ManyToMany,
} from 'typeorm';
import { ProductStockHistory } from './ProductStockHistory';
import { Bin } from '$src/domains/warehouse/models/Bin';
import { Shape } from '$src/domains/configuration/models/Shape';

@Entity()
export class Product implements Static<typeof ProductSchema> {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  name!: string;

  @Column({ nullable: true })
  code?: string;

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

  @ManyToOne(() => SupplierProduct)
  productSuppliers!: Relation<SupplierProduct[]>;

  @ManyToOne(() => ProductStockHistory)
  stockHistory!: Relation<ProductStockHistory[]>;

  @ManyToMany(() => Bin)
  @JoinTable({
    name: 'bin_products',
    joinColumn: { name: 'product_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'bin_id', referencedColumnName: 'id' },
  })
  bins!: Relation<Bin[]>;

  @ManyToOne(() => Unit)
  unit!: Relation<Unit>;

  @ManyToOne(() => Category, (category) => category.id)
  category!: Relation<Category>;

  @ManyToOne(() => Shape, (shape) => shape.id)
  shape!: Relation<Shape> | null;

  @ManyToOne(() => Color, { nullable: true })
  color!: Relation<Color> | null;

  @ManyToOne(() => Brand, { nullable: true })
  brand!: Relation<Brand> | null;

  @ManyToOne(() => Size)
  size!: Relation<Size> | null;

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
