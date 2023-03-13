import { User } from '$src/domains/user/models/User.js';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
} from 'typeorm';
import { Warehouse } from './Warehouse.js';

enum BinProperty {
  HOLDING = 'holding',
  NORMAL = 'normal',
  DAMAGE = 'damage',
}

@Entity()
export class Bin {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  name!: string;

  @ManyToOne(() => Warehouse, (warehouse) => warehouse.id)
  warehouse!: Warehouse;

  // @ManyToOne(() => Size, (size) => size.bins)
  // size!: Size;

  @Column({ type: 'enum', enum: BinProperty })
  property!: BinProperty;

  @Column({ unique: true, nullable: true })
  physicalCode!: string;

  @Column({ unique: true })
  internalCode!: string;

  @ManyToOne(() => User)
  creator!: User;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @DeleteDateColumn()
  deletedAt?: Date;
}
