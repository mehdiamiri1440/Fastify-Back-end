import { Brand } from '$src/domains/configuration/models/Brand';
import { Category } from '$src/domains/configuration/models/Category';
import { Color } from '$src/domains/configuration/models/Color';
import { Unit } from '$src/domains/configuration/models/Unit';
import { ProductSupplier } from '$src/domains/product/models/ProductSupplier';
import { User } from '$src/domains/user/models/User';
import { Static } from '@sinclair/typebox';
import { ProductSchema } from '../schemas/product.schema';
import { ProductSalePrice } from './ProductSalePrice';
import { Size } from './Size';
import { TaxType } from './TaxType';

import { Shape } from '$src/domains/configuration/models/Shape';
import { Tag } from '$src/domains/configuration/models/Tag';
import { Bin } from '$src/domains/warehouse/models/Bin';
import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinTable,
  ManyToMany,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  Relation,
  UpdateDateColumn,
} from 'typeorm';
import { BinProduct } from './BinProduct';
import { ProductImage } from './ProductImage';
import { ProductStockHistory } from './ProductStockHistory';

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

  @OneToMany(
    () => ProductSupplier,
    (productSuppliers) => productSuppliers.product,
  )
  productSuppliers!: Relation<ProductSupplier[]>;

  @OneToMany(() => ProductStockHistory, (stockHistory) => stockHistory.product)
  stockHistory!: Relation<ProductStockHistory[]>;

  @ManyToMany(() => Bin)
  @JoinTable({
    name: 'bin_product',
    joinColumn: { name: 'bin_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'product_id', referencedColumnName: 'id' },
    synchronize: false,
  })
  bins!: Relation<Bin[]>;

  @OneToMany(() => BinProduct, (BinProduct) => BinProduct.product)
  binProducts!: Relation<BinProduct[]>;

  // @ManyToMany(() => Supplier)
  // @JoinTable({
  //   name: 'product_supplier',
  //   joinColumn: { name: 'product_id', referencedColumnName: 'id' },
  //   inverseJoinColumn: { name: 'supplier_id', referencedColumnName: 'id' },
  //   synchronize: false,
  // })
  // suppliers!: Relation<Supplier[]>;

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

  @ManyToMany(() => Tag)
  @JoinTable({
    name: 'product_tag',
  })
  tags!: Relation<Tag[]>;

  @Column({ type: 'text', nullable: true })
  content!: string | null;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @DeleteDateColumn()
  deletedAt!: Date;

  @OneToMany(() => ProductSalePrice, (salePrice) => salePrice.product)
  salePrices!: ProductSalePrice[];

  @OneToMany(() => ProductImage, (image) => image.product)
  images!: Relation<ProductImage[]>;
}
