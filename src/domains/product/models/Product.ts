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
import { ProductMovementHistory } from './ProductMovementHistory';
import { Bin } from '$src/domains/warehouse/models/Bin';

@Entity()
export class Product implements Static<typeof ProductSchema> {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  name!: string;

  @Column({ default: 0 })
  basicQuantity!: number;

  @Column({ default: 0 })
  @Check(`"quantity" >= 0`)
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

  @ManyToOne(() => SupplierProduct)
  productSuppliers!: Relation<SupplierProduct[]>;

  @ManyToOne(() => ProductMovementHistory)
  movementHistories!: Relation<ProductMovementHistory[]>;

  @ManyToMany(() => Bin)
  @JoinTable({
    name: 'bin_products',
    joinColumn: { name: 'product_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'bin_id', referencedColumnName: 'id' },
  })
  bins!: Relation<Bin[]>;

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
