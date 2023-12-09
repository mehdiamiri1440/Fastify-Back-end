import { User } from '$src/domains/user/models/User';
import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity()
export class Location {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'varchar', nullable: true })
  zipCode?: string | null;

  @Column({ type: 'varchar', nullable: true })
  city?: string | null;

  @Column({ type: 'varchar', nullable: true })
  state?: string | null;

  @ManyToOne(() => User, { nullable: true })
  creator!: User;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @DeleteDateColumn()
  deletedAt?: Date;
}
