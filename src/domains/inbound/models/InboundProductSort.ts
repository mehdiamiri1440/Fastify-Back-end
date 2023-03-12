import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
} from "typeorm";
import { User } from "./User";
import { Bin } from "./Bin";
import { InboundProduct } from "./InboundProduct";

@Entity()
export class InboundProductSort {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => InboundProduct, (product) => product.sorts)
  inboundProduct!: InboundProduct;

  @ManyToOne(() => Bin)
  bin: Bin;

  @Column()
  quantity!: number;

  @ManyToOne(() => User)
  creator: User;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @DeleteDateColumn()
  deletedAt!: Date;
}
