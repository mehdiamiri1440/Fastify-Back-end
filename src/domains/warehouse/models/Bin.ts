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
  Index,
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

  @ManyToOne(() => Warehouse, { nullable: false })
  warehouse!: Relation<Warehouse>;

  @ManyToOne(() => BinSize, { nullable: false })
  size!: Relation<BinSize>;

  @ManyToOne(() => BinProperty, { nullable: false })
  property!: Relation<BinProperty>;

  @Column({ type: 'text', nullable: true })
  @Index({
    unique: true,
    where: `(physical_code IS NOT NULL)`,
  })
  physicalCode!: string | null;

  @Column({ unique: true, nullable: false })
  internalCode!: string;

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  @ManyToOne(() => User, { nullable: false })
  creator!: Relation<User>;

  @CreateDateColumn({ nullable: false })
  createdAt!: Date;

  @UpdateDateColumn({ nullable: false })
  updatedAt!: Date;

  @DeleteDateColumn()
  deletedAt!: Date;
}
