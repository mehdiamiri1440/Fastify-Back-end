import { User } from '$src/domains/user/models/User';
import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  ManyToOne,
  PrimaryColumn,
} from 'typeorm';

@Entity()
export class File {
  @PrimaryColumn()
  id!: string;

  @Column()
  bucketName!: string;

  @Column()
  mimetype!: string;

  @Column({ type: 'int' })
  size!: number;

  @Column({ type: 'varchar', nullable: true })
  originalName?: string | null;

  @ManyToOne(() => User, { nullable: true })
  creator?: User | null;

  @CreateDateColumn()
  createdAt!: Date;

  @DeleteDateColumn()
  deletedAt!: Date;
}
