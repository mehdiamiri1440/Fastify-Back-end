import { User } from '$src/domains/user/models/User';
import {
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  Relation,
  UpdateDateColumn,
} from 'typeorm';
import { Warehouse } from './Warehouse';

@Entity()
export class WarehouseStaff {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => User)
  user!: Relation<User>;

  @ManyToOne(() => Warehouse)
  warehouse!: Relation<Warehouse>;

  @ManyToOne(() => User)
  creator!: Relation<User>;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @DeleteDateColumn()
  deletedAt!: Date;
}
