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
import { Language } from './Language';
import { SupplierSchema } from '$src/domains/supplier/schemas/supplier.schema';
import { Static, Type } from '@sinclair/typebox';

const SupplierSchemaWithoutRelations = Type.Omit(SupplierSchema, [
  'creator',
  'language',
]);

@Entity()
export class Supplier implements Static<typeof SupplierSchemaWithoutRelations> {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ nullable: false })
  name!: string;

  @Column({ nullable: false })
  cif!: string;

  @ManyToOne(() => Language, { nullable: false })
  language!: Relation<Language>;

  @Column({ nullable: false })
  iban!: string;

  @Column({ nullable: false })
  email!: string;

  @Column({ nullable: false })
  phoneNumber!: string;

  @Column({ type: 'text', nullable: true })
  logoFileId!: string | null;

  @Column({ nullable: false })
  accountNumber!: string;

  @Column({ type: 'text', nullable: true })
  bic!: string | null;

  @Column({ type: 'text', nullable: true })
  bicName!: string | null;

  @ManyToOne(() => User, { nullable: false })
  creator!: Relation<User>;

  @CreateDateColumn({ nullable: false })
  createdAt!: Date;

  @UpdateDateColumn({ nullable: false })
  updatedAt!: Date;

  @DeleteDateColumn({ nullable: true })
  deletedAt!: Date;
}
