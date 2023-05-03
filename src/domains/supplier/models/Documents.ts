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
import { DocumentSchema } from '$src/domains/supplier/schemas/document.schema';
import { Supplier } from '$src/domains/supplier/models/Supplier';
import { Static, Type } from '@sinclair/typebox';

const DocumentSchemaWithoutRelations = Type.Omit(DocumentSchema, [
  'creator',
  'supplier',
]);

@Entity()
export class SupplierDocument
  implements Static<typeof DocumentSchemaWithoutRelations>
{
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => User, { nullable: false })
  supplier!: Relation<Supplier>;

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
