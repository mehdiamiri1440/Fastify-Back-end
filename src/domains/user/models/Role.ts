import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
} from 'typeorm';
import { User } from './User';
import { RoleType } from '$src/domains/user/schemas/role.schema';
type Safe<T> = T;

@Entity()
export class Role implements RoleType {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ nullable: false, unique: true })
  title!: string;

  @ManyToOne(() => User)
  creator!: Safe<User>;

  @Column({ nullable: false })
  isActive!: boolean;

  @CreateDateColumn({ nullable: false })
  createdAt!: Date;

  @UpdateDateColumn({ nullable: false })
  updatedAt!: Date;

  @DeleteDateColumn()
  deletedAt?: Date;
}
