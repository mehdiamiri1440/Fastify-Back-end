import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  Unique,
  Relation,
} from 'typeorm';
import { Role } from './Role';
import { User } from './User';

@Entity()
@Unique(['role', 'permission'])
export class RolePermission {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => Role)
  role!: Relation<Role>;

  @Column({ nullable: false })
  permission!: string;

  @ManyToOne(() => User)
  creator!: Relation<User>;

  @CreateDateColumn({ nullable: false })
  createdAt!: Date;

  @UpdateDateColumn({ nullable: false })
  updatedAt!: Date;

  @DeleteDateColumn()
  deletedAt?: Date;
}
