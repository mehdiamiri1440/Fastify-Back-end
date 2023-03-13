import { Product } from "$src/domains/product/models/Product.js";
import { Supplier } from "$src/domains/supplier/models/Supplier.js";
import { User } from "$src/domains/user/models/User.js";
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
} from "typeorm";
import { Inbound } from "./Inbound";
import { InboundProductSort } from "./InboundProductSort.js";

@Entity()
export class InboundProduct {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => Inbound, (inbound) => inbound.products)
  inbound!: Inbound;

  @ManyToOne(() => Supplier, { nullable: true })
  supplier!: Supplier;

  @Column()
  quantity!: number;

  @Column({ nullable: true })
  actualQuantity!: number;

  @Column({ nullable: true })
  price!: number;

  @ManyToOne(() => Product)
  product!: Product;

  @ManyToOne(() => User)
  creator!: User;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @DeleteDateColumn()
  deletedAt!: Date;

  @OneToMany(() => InboundProductSort, (sort) => sort.inboundProduct)
  sorts!: InboundProductSort[];
}
