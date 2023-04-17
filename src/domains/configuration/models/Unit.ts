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
import { User } from '$src/domains/user/models/User';
import { Static } from '@sinclair/typebox';
import { UnitSchema } from '$src/domains/configuration/schemas/unit.schema';
@Entity()
export class Unit implements Static<typeof UnitSchema> {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ nullable: false, unique: true })
  name!: string;

  @ManyToOne(() => User)
  creator!: Relation<User>;

  @CreateDateColumn({ nullable: false })
  createdAt!: Date;

  @UpdateDateColumn({ nullable: false })
  updatedAt!: Date;

  @DeleteDateColumn()
  deletedAt!: Date | null;
}
