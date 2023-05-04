import { User } from '$src/domains/user/models/User';
import { Bin } from '$src/domains/warehouse/models/Bin';
import { Product } from './Product';

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  Check,
  Relation,
} from 'typeorm';

enum SourceType {
  INBOUND = 'inbound',
  OUTBOUND = 'outbound',
  BIN = 'bin',
}

@Entity()
export class ProductMovementHistory {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => Product)
  product!: Relation<Product>;

  @ManyToOne(() => Bin, { nullable: false })
  bin!: Relation<Bin>;

  @Column({ nullable: true })
  sourceId!: number | null;

  @Column({ nullable: true })
  sourceType!: 'inbound' | 'outbound' | 'bin' | null;

  @Column({ default: 0 })
  @Check(`"quantity" >= 0`)
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
