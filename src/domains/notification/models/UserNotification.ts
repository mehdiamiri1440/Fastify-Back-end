import { User } from '$src/domains/user/models/User';
import {
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  Relation,
  Column,
} from 'typeorm';
import { Notification } from '$src/domains/notification/models/Notification';

@Entity()
export class UserNotification {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => User, { nullable: false })
  user!: Relation<User>;

  @ManyToOne(() => Notification, { nullable: false })
  notification!: Relation<Notification>;

  @Column({ nullable: false })
  read!: boolean;

  @CreateDateColumn({ nullable: false })
  createdAt!: Date;

  @UpdateDateColumn({ nullable: false })
  updatedAt!: Date;

  @DeleteDateColumn({ nullable: true })
  deletedAt!: Date;
}
