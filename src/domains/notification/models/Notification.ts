import { User } from '$src/domains/user/models/User';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  Relation,
} from 'typeorm';
import { Static, Type } from '@sinclair/typebox';
import { notificationSchema } from '$src/domains/notification/schemas/notification.schema';

const notificationSchemaWithoutRelations = Type.Omit(notificationSchema, [
  'creator',
]);

@Entity()
export class Notification
  implements Static<typeof notificationSchemaWithoutRelations>
{
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  title!: string;

  @Column()
  detail!: string;

  @Column()
  tag!: string;

  @ManyToOne(() => User, { nullable: false })
  creator!: Relation<User>;

  @CreateDateColumn({ nullable: false })
  createdAt!: Date;

  @UpdateDateColumn({ nullable: false })
  updatedAt!: Date;

  @DeleteDateColumn({ nullable: true })
  deletedAt!: Date;
}
