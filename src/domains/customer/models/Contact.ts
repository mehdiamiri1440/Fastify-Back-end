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
  Unique,
} from 'typeorm';
import { ContactSchema } from '../schemas/contact.schema';
import { Static, Type } from '@sinclair/typebox';
import { Customer } from './Customer';

const ContactSchemaWithoutRelations = Type.Omit(ContactSchema, [
  'creator',
  'customer',
]);

@Entity()
@Unique(['customer', 'email'])
@Unique(['customer', 'phoneNumber'])
export class CustomerContact
  implements Static<typeof ContactSchemaWithoutRelations>
{
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'text', nullable: true })
  name!: string | null;

  @Column({ type: 'text', nullable: true })
  surName!: string | null;

  @ManyToOne(() => Customer, { nullable: false, onDelete: 'CASCADE' })
  customer!: Relation<Customer>;

  @Column({ type: 'text', nullable: true })
  position!: string | null;

  @Column({ nullable: false })
  email!: string;

  @Column({ nullable: false })
  phoneNumber!: string;

  @ManyToOne(() => User, { nullable: false })
  creator!: Relation<User>;

  @CreateDateColumn({ nullable: false })
  createdAt!: Date;

  @UpdateDateColumn({ nullable: false })
  updatedAt!: Date;

  @DeleteDateColumn({ nullable: true })
  deletedAt!: Date;
}
