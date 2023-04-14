import { User } from '$src/domains/user/models/User';
import type { Relation } from 'typeorm';
import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { InboundImage } from './InboundImage';
import { InboundProduct } from './InboundProduct';

export enum InboundType {
  NEW = 'new',
  RETURNED = 'returned',
}

enum InboundStatus {
  PRE_DELIVERY = 'pre_delivery',
  LOAD = 'load',
  SORTING = 'sorting',
  SORTED = 'sorted',
}

@Entity()
export class Inbound {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  code!: string;

  @Column({ type: 'enum', enum: InboundType })
  type!: InboundType;

  @Column({
    type: 'enum',
    enum: InboundStatus,
    default: InboundStatus.PRE_DELIVERY,
  })
  status!: InboundStatus;

  @Column()
  docId!: string;

  @ManyToOne(() => User, { nullable: true })
  driverUser!: User;

  @Column({ nullable: true })
  description!: string;

  @ManyToOne(() => User)
  creator!: User;

  @Column()
  creatorId!: number;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @DeleteDateColumn()
  deletedAt!: Date;

  @OneToMany(() => InboundImage, (image) => image.inbound)
  images!: Relation<InboundImage[]>;

  @OneToMany(() => InboundProduct, (product) => product.inbound)
  products!: Relation<InboundProduct[]>;
}
