import { Category } from './Category';
import { Color } from './Color';
import { Size } from './Size';
import { Brand } from './Brand';
import { Unit } from './Unit';
import { TaxType } from './TaxType';
import { User } from '$src/domains/user/models/User';
import { ProductSalePrice } from './ProductSalePrice';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
} from 'typeorm';

@Entity()
export class Product {
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
  taxType!: TaxType;

  @ManyToOne(() => Size)
  size!: Size;

  @ManyToOne(() => Unit)
  unit!: Unit;

  @ManyToOne(() => Brand)
  brand!: Brand;

  @ManyToOne(() => Color)
  color!: Color;

  @ManyToOne(() => Category, (category) => category.id)
  category!: Category;

  @ManyToOne(() => User)
  creator!: User;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @DeleteDateColumn()
  deletedAt!: Date;

  @OneToMany(() => ProductSalePrice, (salePrice) => salePrice.product)
  salePrices!: ProductSalePrice[];
}
