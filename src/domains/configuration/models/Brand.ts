import { BrandSchema } from '$src/domains/configuration/schemas/brand.schema';
import { File } from '$src/domains/files/models/File';
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

const BrandSchemaWithoutRelations = Type.Omit(BrandSchema, [
  'creator',
  'logoId',
]);

@Entity()
export class Brand implements Static<typeof BrandSchemaWithoutRelations> {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => File, { nullable: true })
  logo!: File | null;

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
