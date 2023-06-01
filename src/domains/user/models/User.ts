import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  Relation,
  UpdateDateColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { UserSchema } from '../schemas/user.schema';
import { Role } from './Role';
import { Static, Type } from '@sinclair/typebox';
import { WarehouseStaff } from '$src/domains/warehouse/models/WarehouseStaff';

const UserSchemaWithoutRelations = Type.Omit(UserSchema, ['creator', 'role']);

@Entity()
export class User implements Static<typeof UserSchemaWithoutRelations> {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ nullable: false })
  firstName!: string;

  @Column({ nullable: false })
  lastName!: string;

  @Column({
    generatedType: 'STORED',
    asExpression: `"first_name" || ' ' || "last_name"`,
  })
  fullName!: string;

  @ManyToOne(() => Role, { onDelete: 'SET NULL' })
  role!: Relation<Role>;

  @Column({ nullable: false })
  nif!: string;

  @Column({ unique: true, nullable: false })
  email!: string;

  @Column({ type: 'text', nullable: true })
  @Index({
    unique: true,
    where: `(phone_number IS NOT NULL)`,
  })
  phoneNumber?: string | null;

  @Column({ nullable: false })
  password!: string;

  @Column({ type: 'text', nullable: true })
  position?: string | null;

  @Column({ nullable: false })
  isActive!: boolean;

  @OneToMany(() => WarehouseStaff, (warehouseStaff) => warehouseStaff.user)
  staffWarehouses!: WarehouseStaff[];

  @ManyToOne(() => User, { nullable: true })
  creator!: Relation<User>;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @DeleteDateColumn()
  deletedAt?: Date;
}
