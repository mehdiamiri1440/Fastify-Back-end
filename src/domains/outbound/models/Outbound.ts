import { QrCodeType } from '$src/domains/qrcode/utils';
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
  NEW_ORDER = 'new_order', // during this state, we perform product supplies
  TRANSFER = 'transfer', // during this state, we collect creator and customer signatures
  PICKING = 'picking', // during this state, we collect creator and driver signatures
  PICKED = 'picked', // during this state, we collect customer signature
  DELIVERED = 'delivered',
}

export enum ReceiverType {
  CUSTOMER = 'customer',
  USER = 'user',
}

@Entity()
export class Outbound {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({
    type: 'varchar',
    generatedType: 'STORED',
    asExpression: `('${QrCodeType.OUTBOUND}' || immutable_format_date(created_at) || LPAD((id % 10000)::text, 4, '0'))`,
  })
  code!: string;

  @Column({
    type: 'enum',
    enum: OutboundStatus,
    default: OutboundStatus.DRAFT,
  })
  status!: OutboundStatus;

  @Column({ type: 'integer', nullable: true })
  docId!: number | null;

  @Column({
    type: 'enum',
    enum: ReceiverType,
    nullable: true,
  })
  receiverType!: ReceiverType | null;

  @Column({
    type: 'int4',
    enum: ReceiverType,
    nullable: true,
  })
  receiverId!: number | null;

  @ManyToOne(() => User, { nullable: true })
  driver?: User | null;

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
