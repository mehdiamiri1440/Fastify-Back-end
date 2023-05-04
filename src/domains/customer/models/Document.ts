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
} from 'typeorm';
import { DocumentSchema } from '$src/domains/customer/schemas/document.schema';
import { Customer } from './Customer';
import { Static, Type } from '@sinclair/typebox';

const DocumentSchemaWithoutRelations = Type.Omit(DocumentSchema, [
  'creator',
  'customer',
]);

@Entity()
export class CustomerDocument
  implements Static<typeof DocumentSchemaWithoutRelations>
{
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => Customer, { nullable: false, onDelete: 'CASCADE' })
  customer!: Relation<Customer>;

  @Column({ nullable: false })
  fileId!: string;

  @ManyToOne(() => User, { nullable: false })
  creator!: Relation<User>;

  @CreateDateColumn({ nullable: false })
  createdAt!: Date;

  @UpdateDateColumn({ nullable: false })
  updatedAt!: Date;

  @DeleteDateColumn({ nullable: true })
  deletedAt!: Date;
}
