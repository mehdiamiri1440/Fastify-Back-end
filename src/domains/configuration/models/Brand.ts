import { BrandSchema } from '$src/domains/configuration/schemas/brand.schema';
import { User } from '$src/domains/user/models/User';
import { Static, Type } from '@sinclair/typebox';
import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  Relation,
  UpdateDateColumn,
} from 'typeorm';

const BrandSchemaWithoutRelations = Type.Omit(BrandSchema, ['creator']);

@Entity()
export class Brand implements Static<typeof BrandSchemaWithoutRelations> {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'varchar', nullable: true })
  logoFileId!: string | null;

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
