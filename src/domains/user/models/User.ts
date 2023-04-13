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
import { ModelUserType } from '../schemas/user.schema';
import { Role } from './Role';

@Entity()
export class User implements ModelUserType {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ nullable: false })
  firstName!: string;

  @Column({ nullable: false })
  lastName!: string;

  @ManyToOne(() => Role)
  role!: Relation<Role>;

  @Column({ nullable: false })
  nif!: string;

  @Column({ unique: true, nullable: false })
  email!: string;

  @Column({ type: 'text', unique: true, nullable: true })
  phoneNumber?: string | null;

  @Column({ nullable: false })
  password!: string;

  @Column({ type: 'text', nullable: true })
  position?: string | null;

  @Column({ nullable: false })
  isActive!: boolean;

  @ManyToOne(() => User)
  creator!: Relation<User>;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @DeleteDateColumn()
  deletedAt?: Date;
}
