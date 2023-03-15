import { User } from '$src/domains/user/models/User';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  ManyToOne,
} from 'typeorm';

@Entity()
export class Warehouse {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  name!: string;

  // @ManyToOne(() => Province, { eager: true })
  // province!: Province;

  // @ManyToOne(() => City, { eager: true })
  // city!: City;

  // @ManyToOne(() => Street, { eager: true })
  // street!: Street;

  @Column()
  postalCode!: string;

  @Column()
  description!: string;

  @ManyToOne(() => User)
  creator!: User;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @DeleteDateColumn()
  deletedAt!: Date;
}
