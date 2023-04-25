import { User } from '$src/domains/user/models/User';
import { Warehouse } from '$src/domains/warehouse/models/Warehouse';
import type { Relation } from 'typeorm';
import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { OutboundProduct } from './OutboundProduct';

export enum OutboundStatus {
  DRAFT = 'draft',
  NEW_ORDER = 'new_order',
  PRE_PICK = 'pre_pick',
  PICKING = 'picking',
  PICKED = 'picked',
  DELIVERED = 'delivered',
}

@Entity()
export class Outbound {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ nullable: true, type: 'varchar' })
  code!: string | null;

  @Column({
    type: 'enum',
    enum: OutboundStatus,
    default: OutboundStatus.DRAFT,
  })
  status!: OutboundStatus;

  @Column({ type: 'integer', nullable: true })
  docId!: number | null;

  @Column({ nullable: true })
  customerId!: number;

  @ManyToOne(() => User, { nullable: true })
  driver!: User | null;

  @Column({
    type: 'varchar',
    nullable: true,
    comment: 'fileId of creator signature',
  })
  creatorSignature!: string | null;

  @Column({
    type: 'varchar',
    nullable: true,
    comment: 'fileId of driver signature',
  })
  driverSignature!: string | null;

  @Column({
    type: 'varchar',
    nullable: true,
    comment: 'fileId of driver signature',
  })
  customerSignature!: string | null;

  @ManyToOne(() => User)
  creator!: User;

  @ManyToOne(() => Warehouse)
  warehouse!: Warehouse;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @DeleteDateColumn()
  deletedAt!: Date;

  @OneToMany(() => OutboundProduct, (product) => product.outbound)
  products!: Relation<OutboundProduct[]>;
}
