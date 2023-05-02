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
import { BinSizeSchema } from '$src/domains/warehouse/schemas/bin-size.schema';
import { Type, Static } from '@sinclair/typebox';

const BinSizeSchemaWithoutRelations = Type.Omit(BinSizeSchema, ['creator']);

@Entity()
export class BinSize implements Static<typeof BinSizeSchemaWithoutRelations> {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ nullable: false })
  title!: string;

  @Column({ type: 'text', nullable: true })
  width!: string | null;

  @Column({ type: 'text', nullable: true })
  length!: string | null;

  @ManyToOne(() => User)
  creator!: Relation<User>;

  @CreateDateColumn({ nullable: false })
  createdAt!: Date;

  @UpdateDateColumn({ nullable: false })
  updatedAt!: Date;

  @DeleteDateColumn()
  deletedAt!: Date;
}
