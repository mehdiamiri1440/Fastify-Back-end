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
import { Static } from '@sinclair/typebox';
import { BrandSchema } from '$src/domains/configuration/schemas/brand.schema';
import { Type } from '@sinclair/typebox';

const BrandSchemaWithoutRelations = Type.Omit(BrandSchema, ['creator']);

@Entity()
export class Brand implements Static<typeof BrandSchemaWithoutRelations> {
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
