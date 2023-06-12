import { DocumentSchema } from '$src/domains/customer/schemas/document.schema';
import { File } from '$src/domains/files/models/File';
import { User } from '$src/domains/user/models/User';
import { Static, Type } from '@sinclair/typebox';
import {
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  Relation,
  UpdateDateColumn,
} from 'typeorm';
import { Customer } from './Customer';

const DocumentSchemaWithoutRelations = Type.Omit(DocumentSchema, [
  'creator',
  'customer',
  'fileId',
]);

@Entity()
export class CustomerDocument
  implements Static<typeof DocumentSchemaWithoutRelations>
{
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => Customer, { nullable: false })
  customer!: Relation<Customer>;

  @ManyToOne(() => File, { nullable: false })
  file!: File;

  @ManyToOne(() => User, { nullable: false })
  creator!: Relation<User>;

  @CreateDateColumn({ nullable: false })
  createdAt!: Date;

  @UpdateDateColumn({ nullable: false })
  updatedAt!: Date;

  @DeleteDateColumn({ nullable: true })
  deletedAt!: Date;
}
