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
import { Nationality } from './Nationality';
import {
  CustomerSchema,
  subscriberType,
  documentType,
} from '../schemas/customer.schema';
import { Static, Type } from '@sinclair/typebox';

const CustomerSchemaWithoutRelations = Type.Omit(CustomerSchema, [
  'creator',
  'nationality',
]);

@Entity()
export class Customer implements Static<typeof CustomerSchemaWithoutRelations> {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ nullable: false })
  name!: string;

  @Column({ type: 'text', nullable: true })
  businessName!: string | null;

  @Column({ nullable: false, type: 'enum', enum: subscriberType.enum })
  subscriberType!: Static<typeof subscriberType>;

  @Column({ nullable: false, type: 'enum', enum: documentType.enum })
  documentType!: Static<typeof documentType>;

  @Column({ nullable: true, type: 'enum', enum: documentType.enum })
  businessDocumentType!: Static<typeof documentType> | null;

  @Column({ nullable: false })
  fiscalId!: string;

  @Column({ type: 'text', nullable: true })
  businessFiscalId!: string | null;

  @Column({ nullable: false })
  contactFamily1!: string;

  @Column({ type: 'text', nullable: true })
  contactFamily2!: string | null;

  @ManyToOne(() => Nationality, { nullable: false })
  nationality!: Relation<Nationality>;

  @Column({ nullable: false })
  birthday!: string;

  @Column({ nullable: false })
  isActive!: boolean;

  @ManyToOne(() => User, { nullable: false })
  creator!: Relation<User>;

  @CreateDateColumn({ nullable: false })
  createdAt!: Date;

  @UpdateDateColumn({ nullable: false })
  updatedAt!: Date;

  @DeleteDateColumn({ nullable: true })
  deletedAt!: Date;
}
