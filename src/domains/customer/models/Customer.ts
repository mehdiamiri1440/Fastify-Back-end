import { User } from '$src/domains/user/models/User';
import { Static, Type } from '@sinclair/typebox';
import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  Relation,
  UpdateDateColumn,
} from 'typeorm';
import { AddressSchema } from '../../geo/address.schema';
import {
  CustomerSchema,
  documentType,
  subscriberType,
} from '../schemas/customer.schema';
import { CustomerContact } from './Contact';
import { Nationality } from './Nationality';
import { QrCodeType } from '$src/domains/qrcode/utils';

const CustomerSchemaWithoutRelations = Type.Omit(CustomerSchema, [
  'creator',
  'nationalityId',
]);

@Entity()
export class Customer implements Static<typeof CustomerSchemaWithoutRelations> {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({
    type: 'varchar',
    generatedType: 'STORED',
    asExpression: `('${QrCodeType.CUSTOMER}' || immutable_format_date(created_at) || LPAD((id % 10000)::text, 4, '0'))`,
  })
  code!: string;

  @Column({ nullable: false })
  name!: string;

  @Column({ type: 'text', nullable: true })
  contactName!: string | null;

  @Column({ nullable: false, type: 'enum', enum: subscriberType.enum })
  subscriberType!: Static<typeof subscriberType>;

  @Column({ nullable: false, type: 'enum', enum: documentType.enum })
  documentType!: Static<typeof documentType>;

  @Column({ nullable: true, type: 'enum', enum: documentType.enum })
  contactDocumentType!: Static<typeof documentType> | null;

  @Column({ nullable: false })
  @Index({
    unique: true,
    where: `(deleted_at IS NULL)`,
  })
  fiscalId!: string;

  @Column({ type: 'text', nullable: true })
  contactFiscalId!: string | null;

  @Column({ nullable: false })
  contactFamily1!: string;

  @Column({ type: 'text', nullable: true })
  contactFamily2!: string | null;

  @ManyToOne(() => Nationality, { nullable: false })
  nationality!: Relation<Nationality>;

  @Column({
    type: 'jsonb',
    nullable: true,
  })
  address!: Static<typeof AddressSchema> | null;

  @OneToMany(
    () => CustomerContact,
    (customerContacts) => customerContacts.customer,
  )
  contacts!: CustomerContact[];

  @Column({ type: 'text', nullable: true })
  birthday!: string | null;

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
