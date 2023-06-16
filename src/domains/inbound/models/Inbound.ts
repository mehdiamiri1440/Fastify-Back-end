import { User } from '$src/domains/user/models/User';
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
import { InboundImage } from './InboundImage';
import { InboundProduct } from './InboundProduct';
import { Warehouse } from '$src/domains/warehouse/models/Warehouse';
import { QrCodeType } from '$src/domains/qrcode/utils';

export enum InboundType {
  NEW = 'new',
  RETURNED = 'returned',
}

export enum InboundStatus {
  PRE_DELIVERY = 'pre_delivery',
  LOAD = 'load',
  SORTING = 'sorting',
  SORTED = 'sorted',
}

@Entity()
export class Inbound {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({
    type: 'varchar',
    generatedType: 'STORED',
    asExpression: `('${QrCodeType.INBOUND}' || immutable_format_date(created_at) || LPAD((id % 10000)::text, 4, '0'))`,
  })
  code!: string;

  @Column({ type: 'enum', enum: InboundType })
  type!: InboundType;

  @Column({
    type: 'enum',
    enum: InboundStatus,
    default: InboundStatus.PRE_DELIVERY,
  })
  status!: InboundStatus;

  @Column({ type: 'integer', nullable: true })
  docId!: number | null;

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

  @Column({ type: 'varchar', nullable: true })
  description!: string | null;

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

  @OneToMany(() => InboundImage, (image) => image.inbound)
  images!: Relation<InboundImage[]>;

  @OneToMany(() => InboundProduct, (product) => product.inbound)
  products!: Relation<InboundProduct[]>;
}
