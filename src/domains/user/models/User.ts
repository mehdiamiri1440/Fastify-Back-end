import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
} from 'typeorm';
import { UserType } from '../schemas/user.schema';
import { Role } from './Role';
type Safe<T> = T;

@Entity()
export class User implements UserType {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ nullable: false })
  firstName!: string;

  @Column({ nullable: false })
  lastName!: string;

  @ManyToOne(() => Role)
  role!: Safe<Role>;

  @Column({ nullable: false })
  nif!: number;

  @Column({ unique: true, nullable: false })
  email!: string;

  @Column({ unique: true, nullable: true })
  phoneNumber?: string;

  @Column({ nullable: false })
  password!: string;

  @Column({ nullable: true })
  position?: string;

  @Column({ nullable: false })
  isActive!: boolean;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @DeleteDateColumn()
  deletedAt?: Date;
}
