import { User } from '$src/domains/user/models/User';
import { Product } from './Product';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  Relation,
} from 'typeorm';

@Entity()
export class ProductSalePrice {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => Product, (product) => product.salePrices)
  product!: Relation<Product>;

  @Column()
  price!: number;

  @ManyToOne(() => User)
  creator!: User;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @DeleteDateColumn()
  deletedAt!: Date;
}
