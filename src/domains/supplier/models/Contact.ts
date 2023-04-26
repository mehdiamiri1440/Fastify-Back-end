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
import { ContactSchema } from '$src/domains/supplier/schemas/contact.schema';
import { Supplier } from '$src/domains/supplier/models/Supplier';
import { Static, Type } from '@sinclair/typebox';

const ContactSchemaWithoutRelations = Type.Omit(ContactSchema, [
  'creator',
  'supplier',
]);

@Entity()
export class SupplierContact implements Static<typeof ContactSchemaWithoutRelations> {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ nullable: false })
  name!: string;

  @ManyToOne(() => User, { nullable: false })
  supplier!: Relation<Supplier>;

  @Column({ type: 'text', nullable: true })
  position!: string | null;

  @Column({ type: 'text', nullable: true })
  email!: string | null;

  @Column({ type: 'text', nullable: true })
  phoneNumber!: string | null;

  @ManyToOne(() => User, { nullable: false })
  creator!: Relation<User>;

  @CreateDateColumn({ nullable: false })
  createdAt!: Date;

  @UpdateDateColumn({ nullable: false })
  updatedAt!: Date;

  @DeleteDateColumn({ nullable: true })
  deletedAt!: Date;
}
