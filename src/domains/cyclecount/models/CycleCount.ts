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
  OneToMany,
} from 'typeorm';
import { Static, Type } from '@sinclair/typebox';
import { Bin } from '$src/domains/warehouse/models/Bin';
import { Product } from '$src/domains/product/models/Product';
import {
  CycleCountSchema,
  cycleCountType,
} from '$src/domains/cyclecount/schemas/cyclecount.schema';
import { cycleCountState } from '$src/domains/cyclecount/schemas/cyclecount.schema';
import { CycleCountDifference } from '$src/domains/cyclecount/models/Difference';

const CycleCountSchemaWithoutRelations = Type.Omit(CycleCountSchema, [
  'bin',
  'product',
  'checker',
  'creator',
]);

@Entity()
export class CycleCount
  implements Static<typeof CycleCountSchemaWithoutRelations>
{
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ nullable: false, type: 'enum', enum: cycleCountState.enum })
  cycleCountState!: Static<typeof cycleCountState>;

  @Column({ nullable: false, type: 'enum', enum: cycleCountType.enum })
  cycleCountType!: Static<typeof cycleCountType>;

  @ManyToOne(() => Bin, { nullable: true })
  bin!: Relation<Bin>;

  @ManyToOne(() => Product, { nullable: true })
  product!: Relation<Product>;

  @OneToMany(
    () => CycleCountDifference,
    (CycleCountDifference) => CycleCountDifference.cycleCount,
  )
  differences!: CycleCountDifference[];

  @ManyToOne(() => User, { nullable: true })
  checker!: Relation<User> | null;

  @ManyToOne(() => User, { nullable: false })
  creator!: Relation<User>;

  @CreateDateColumn({ nullable: false })
  createdAt!: Date;

  @UpdateDateColumn({ nullable: false })
  updatedAt!: Date;

  @DeleteDateColumn({ nullable: true })
  deletedAt!: Date;
}
