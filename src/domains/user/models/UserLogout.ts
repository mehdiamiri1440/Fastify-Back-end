import { Entity, ManyToOne, CreateDateColumn, Relation } from 'typeorm';
import { User } from './User';

@Entity()
export class UserLogout {
  @ManyToOne(() => User, { nullable: true })
  user!: Relation<User>;

  @CreateDateColumn({ nullable: false })
  createdAt!: Date;
}
