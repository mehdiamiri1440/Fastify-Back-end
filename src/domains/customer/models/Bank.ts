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
import { BankSchema } from '../schemas/bank.schema';
import { Static, Type } from '@sinclair/typebox';
import { Customer } from './Customer';

const BankSchemaWithoutRelations = Type.Omit(BankSchema, [
  'creator',
  'customer',
]);

@Entity()
export class CustomerBank implements Static<typeof BankSchemaWithoutRelations> {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => Customer, { nullable: false, onDelete: 'CASCADE' })
  customer!: Relation<Customer>;

  @Column({ nullable: false })
  iban!: string;

  @Column({ nullable: false })
  bic!: string;

  @Column({ nullable: false })
  bankName!: string;

  @ManyToOne(() => User, { nullable: false })
  creator!: Relation<User>;

  @CreateDateColumn({ nullable: false })
  createdAt!: Date;

  @UpdateDateColumn({ nullable: false })
  updatedAt!: Date;

  @DeleteDateColumn({ nullable: true })
  deletedAt!: Date;
}
