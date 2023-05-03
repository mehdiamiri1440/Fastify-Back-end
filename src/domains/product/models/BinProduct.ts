import { User } from '$src/domains/user/models/User';
import { Bin } from '$src/domains/warehouse/models/Bin';
import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  Relation,
  UpdateDateColumn,
} from 'typeorm';
import { Product } from './Product';

@Entity()
export class BinProduct {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => Bin)
  bin!: Relation<Bin>;

  @ManyToOne(() => Product)
  product!: Relation<Product>;

  @Column({ default: 0 })
  quantity!: number;

  @ManyToOne(() => User)
  creator!: User;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @DeleteDateColumn()
  deletedAt!: Date;
}
