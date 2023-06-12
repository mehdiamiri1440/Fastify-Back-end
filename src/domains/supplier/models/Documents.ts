import { File } from '$src/domains/files/models/File';
import { Supplier } from '$src/domains/supplier/models/Supplier';
import { DocumentSchema } from '$src/domains/supplier/schemas/document.schema';
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

const DocumentSchemaWithoutRelations = Type.Omit(DocumentSchema, [
  'creator',
  'supplier',
  'fileId',
]);

@Entity()
export class SupplierDocument
  implements Static<typeof DocumentSchemaWithoutRelations>
{
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => Supplier, { nullable: false })
  supplier!: Relation<Supplier>;

  @ManyToOne(() => File, { nullable: false })
  file!: Relation<File>;

  @ManyToOne(() => User, { nullable: false })
  creator!: Relation<User>;

  @CreateDateColumn({ nullable: false })
  createdAt!: Date;

  @UpdateDateColumn({ nullable: false })
  updatedAt!: Date;

  @DeleteDateColumn({ nullable: true })
  deletedAt!: Date;
}
