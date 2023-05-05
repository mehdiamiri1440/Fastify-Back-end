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
import { Static, Type } from '@sinclair/typebox';
import { TagSchema } from '$src/domains/configuration/schemas/tag.schema';

const TagSchemaWithoutRelations = Type.Omit(TagSchema, ['creator']);

@Entity()
export class Tag implements Static<typeof TagSchemaWithoutRelations> {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ nullable: false, unique: true })
  name!: string;

  @ManyToOne(() => User)
  creator!: Relation<User>;

  @CreateDateColumn({ nullable: false })
  createdAt!: Date;

  @UpdateDateColumn({ nullable: false })
  updatedAt!: Date;

  @DeleteDateColumn()
  deletedAt!: Date | null;
}
