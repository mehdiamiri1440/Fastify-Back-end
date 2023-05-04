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
import { AddressSchema } from '../schemas/address.schema';
import { Static, Type } from '@sinclair/typebox';
import { Customer } from './Customer';

const AddressSchemaWithoutRelations = Type.Omit(AddressSchema, [
  'creator',
  'customer',
]);

@Entity()
export class CustomerAddress
  implements Static<typeof AddressSchemaWithoutRelations>
{
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => Customer, { nullable: false, onDelete: 'CASCADE' })
  customer!: Relation<Customer>;

  @Column({ nullable: false })
  province!: string;

  @Column({ nullable: false })
  city!: string;

  @Column({ nullable: false })
  street!: string;

  @Column({ nullable: false })
  postalCode!: string;

  @Column({ type: 'int', nullable: true })
  number!: number | null;

  @Column({ type: 'text', nullable: true })
  building!: string | null;

  @Column({ type: 'text', nullable: true })
  stairway!: string | null;

  @Column({ type: 'text', nullable: true })
  floor!: string | null;

  @Column({ type: 'text', nullable: true })
  door!: string | null;

  @Column({ type: 'float', nullable: true })
  latitude!: number | null;

  @Column({ type: 'float', nullable: true })
  longitude!: number | null;

  @ManyToOne(() => User, { nullable: false })
  creator!: Relation<User>;

  @CreateDateColumn({ nullable: false })
  createdAt!: Date;

  @UpdateDateColumn({ nullable: false })
  updatedAt!: Date;

  @DeleteDateColumn({ nullable: true })
  deletedAt!: Date;
}
