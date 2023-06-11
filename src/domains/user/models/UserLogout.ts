import {
  Entity,
  ManyToOne,
  CreateDateColumn,
  Relation,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from './User';

@Entity()
export class UserLogout {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => User, { nullable: true })
  user!: Relation<User>;

  @CreateDateColumn({ nullable: false })
  createdAt!: Date;
}
