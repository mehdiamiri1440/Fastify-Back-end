import { User } from '$src/domains/user/models/User';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  ManyToOne,
  Relation,
} from 'typeorm';
import { BinPropertySchema } from '$src/domains/warehouse/schemas/bin-property.schema';
import { Static, Type } from '@sinclair/typebox';

const BinPropertySchemaWithoutRelations = Type.Omit(BinPropertySchema, [
  'creator',
]);

@Entity()
export class BinProperty
  implements Static<typeof BinPropertySchemaWithoutRelations>
{
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ nullable: false })
  title!: string;

  @ManyToOne(() => User, { nullable: false })
  creator!: Relation<User>;

  @CreateDateColumn({ nullable: false })
  createdAt!: Date;

  @UpdateDateColumn({ nullable: false })
  updatedAt!: Date;

  @DeleteDateColumn()
  deletedAt!: Date;
}
