import {
  Entity,
  ManyToOne,
  CreateDateColumn,
  Relation,
  PrimaryGeneratedColumn,
  Column,
  UpdateDateColumn,
} from 'typeorm';
import { User } from './User';

@Entity()
export class RefreshToken {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => User, { nullable: true })
  user!: Relation<User>;

  @Column({ default: true })
  valid!: boolean;

  @UpdateDateColumn({ nullable: false })
  updatedAt!: Date;

  @CreateDateColumn({ nullable: false })
  createdAt!: Date;
}
