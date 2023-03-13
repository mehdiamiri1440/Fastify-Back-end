import { User } from "$src/domains/user/models/User.js";
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  ManyToOne,
} from "typeorm";

@Entity()
export class Brand {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ unique: true, length: 4 })
  title!: string;

  @ManyToOne(() => User, { nullable: false })
  creator!: User;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @DeleteDateColumn()
  deletedAt?: Date;
}
