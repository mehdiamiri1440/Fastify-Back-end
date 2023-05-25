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

export enum SourceType {
  INBOUND = 'inbound',
  OUTBOUND = 'outbound',
  MOVE = 'move',
  INIT = 'init',
  CYCLE_COUNT = 'CYCLE_COUNT',
}

@Entity()
export class ProductStockHistory {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => Product)
  product!: Relation<Product>;

  @ManyToOne(() => Bin, { nullable: false })
  bin!: Relation<Bin>;

  @Column({ type: 'enum', nullable: true, enum: SourceType })
  sourceType!: SourceType | null;

  @Column({ type: 'integer', nullable: true })
  sourceId!: number | null;

  @Column()
  description!: string;

  @Column()
  @Check(`"quantity" != 0`)
  quantity!: number; // any number from negative to positive except zero

  @ManyToOne(() => User)
  creator!: User;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @DeleteDateColumn()
  deletedAt!: Date;
}
