import { User } from '$src/domains/user/models/User';
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
import { Warehouse } from './Warehouse';
import { BinSchema } from '$src/domains/warehouse/schemas/bin.schema';
import { BinSize } from '$src/domains/warehouse/models/BinSize';
import { BinProperty } from '$src/domains/warehouse/models/BinProperty';
import { Static, Type } from '@sinclair/typebox';

const BinSchemaWithoutRelations = Type.Omit(BinSchema, [
  'creator',
  'warehouse',
  'size',
  'property',
]);

@Entity()
export class Bin implements Static<typeof BinSchemaWithoutRelations> {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ nullable: false })
  name!: string;

  @ManyToOne(() => Warehouse)
  warehouse!: Relation<Warehouse>;

  @ManyToOne(() => BinSize)
  size!: Relation<BinSize>;

  @ManyToOne(() => BinProperty)
  property!: Relation<BinProperty>;

  @Column({ type: 'text', unique: true, nullable: true })
  physicalCode!: string | null;

  @Column({ unique: true, nullable: false })
  internalCode!: string;

  @ManyToOne(() => User)
  creator!: Relation<User>;

  @CreateDateColumn({ nullable: false })
  createdAt!: Date;

  @UpdateDateColumn({ nullable: false })
  updatedAt!: Date;

  @DeleteDateColumn()
  deletedAt!: Date;
}
