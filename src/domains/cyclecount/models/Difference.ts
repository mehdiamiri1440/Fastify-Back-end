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
import { Static, Type } from '@sinclair/typebox';
import { CycleCountDifferenceSchema } from '$src/domains/cyclecount/schemas/difference.schema';
import { BinProduct } from '$src/domains/product/models/BinProduct';
import { CycleCount } from '$src/domains/cyclecount/models/CycleCount';

const CycleCountDifferenceSchemaWithoutRelations = Type.Omit(
  CycleCountDifferenceSchema,
  ['cycleCount', 'binProduct', 'counter'],
);

@Entity()
export class CycleCountDifference
  implements Static<typeof CycleCountDifferenceSchemaWithoutRelations>
{
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => CycleCount, { nullable: false })
  cycleCount!: Relation<CycleCount>;

  @ManyToOne(() => BinProduct, { nullable: false })
  binProduct!: Relation<BinProduct>;

  @Column({ type: 'int', nullable: true })
  quantity!: number | null;

  @Column({ type: 'int', nullable: false })
  difference!: number;

  @Column({ type: 'bit', nullable: true })
  status!: boolean | null;

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  @ManyToOne(() => User, { nullable: true })
  counter!: Relation<User>;

  @CreateDateColumn({ nullable: false })
  createdAt!: Date;

  @UpdateDateColumn({ nullable: false })
  updatedAt!: Date;

  @DeleteDateColumn({ nullable: true })
  deletedAt!: Date;
}
