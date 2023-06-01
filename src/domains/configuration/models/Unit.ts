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
import { User } from '$src/domains/user/models/User';
import { UnitSchema } from '$src/domains/configuration/schemas/unit.schema';
import { Static, Type } from '@sinclair/typebox';

const UnitSchemaWithoutRelations = Type.Omit(UnitSchema, ['creator']);

@Entity()
export class Unit implements Static<typeof UnitSchemaWithoutRelations> {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ nullable: false, unique: true })
  name!: string;

  @ManyToOne(() => User, { nullable: false })
  creator!: Relation<User>;

  @CreateDateColumn({ nullable: false })
  createdAt!: Date;

  @UpdateDateColumn({ nullable: false })
  updatedAt!: Date;

  @DeleteDateColumn()
  deletedAt!: Date | null;
}
