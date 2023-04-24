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
import { User } from './User';
import { RoleSchema } from '$src/domains/user/schemas/role.schema';
import { Static, Type } from '@sinclair/typebox';

const RoleSchemaWithoutRelations = Type.Omit(RoleSchema, ['creator']);

@Entity()
export class Role implements Static<typeof RoleSchemaWithoutRelations> {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ nullable: false, unique: true })
  title!: string;

  @ManyToOne(() => User)
  creator!: Relation<User>;

  @Column({ nullable: false })
  isActive!: boolean;

  @CreateDateColumn({ nullable: false })
  createdAt!: Date;

  @UpdateDateColumn({ nullable: false })
  updatedAt!: Date;

  @DeleteDateColumn()
  deletedAt?: Date;
}
