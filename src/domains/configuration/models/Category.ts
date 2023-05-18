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
  JoinColumn,
} from 'typeorm';
import { User } from '$src/domains/user/models/User';
import { Static, Type } from '@sinclair/typebox';
import { CategorySchema } from '$src/domains/configuration/schemas/category.schema';

const CategorySchemaWithoutRelations = Type.Omit(CategorySchema, [
  'creator',
  'parentId',
]);

@Entity()
export class Category implements Static<typeof CategorySchemaWithoutRelations> {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ nullable: false, unique: true })
  name!: string;

  @ManyToOne(() => Category, (category) => category.children, {
    nullable: true,
  })
  @JoinColumn()
  parent?: Category | null;

  @OneToMany(() => Category, (category) => category.parent)
  children?: Category[];

  @ManyToOne(() => User)
  creator!: Relation<User>;

  @CreateDateColumn({ nullable: false })
  createdAt!: Date;

  @UpdateDateColumn({ nullable: false })
  updatedAt!: Date;

  @DeleteDateColumn()
  deletedAt!: Date | null;
}
