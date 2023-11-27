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

/**
 * this is a polymorphic table. type and typeId columns are used to achieve this
 */
@Entity()
export class Document {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  typeId!: number;

  @ManyToOne(() => User)
  creator!: User;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @DeleteDateColumn()
  deletedAt!: Date;
}
