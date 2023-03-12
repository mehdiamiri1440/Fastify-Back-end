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
import { InboundImage } from "./InboundImage.js";
import { InboundProduct } from "./InboundProduct.js";

enum InboundType {
  NEW = "new",
  RETURNED = "returned",
}

enum InboundStatus {
  PRE_DELIVERY = "pre_delivery",
  LOAD = "load",
  SORTING = "sorting",
  SORTED = "sorted",
}

@Entity()
export class Inbound {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: "enum", enum: InboundType })
  type!: InboundType;

  @Column({ type: "enum", enum: InboundStatus })
  status!: InboundStatus;

  @Column()
  docId!: string;

  @ManyToOne(() => User, { nullable: true })
  driverUser!: User;

  @Column({ nullable: true })
  description!: string;

  @ManyToOne(() => User)
  creator!: User;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @DeleteDateColumn()
  deletedAt!: Date;

  @OneToMany(() => InboundImage, (image) => image.inbound)
  images!: InboundImage[];

  @OneToMany(() => InboundProduct, (product) => product.inbound)
  products!: InboundProduct[];
}
