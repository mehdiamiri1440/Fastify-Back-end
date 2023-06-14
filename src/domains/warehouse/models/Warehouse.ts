import { User } from '$src/domains/user/models/User';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  ManyToOne,
  Relation,
  OneToMany,
} from 'typeorm';
import { WarehouseSchema } from '$src/domains/warehouse/schemas/warehouse.schema';
import { Static, Type } from '@sinclair/typebox';
import { WarehouseStaff } from './WarehouseStaff';
import { AddressSchema } from '$src/domains/geo/address.schema';

const WarehouseSchemaWithoutRelations = Type.Omit(WarehouseSchema, [
  'creator',
  'supervisor',
]);

@Entity()
export class Warehouse
  implements Static<typeof WarehouseSchemaWithoutRelations>
{
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ nullable: false })
  name!: string;

  @Column({
    type: 'jsonb',
    nullable: true,
  })
  address!: Static<typeof AddressSchema>;

  @OneToMany(
    () => WarehouseStaff,
    (warehouseStaffs) => warehouseStaffs.warehouse,
  )
  warehouseStaffs!: Relation<WarehouseStaff>;

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  @ManyToOne(() => User, { nullable: true })
  supervisor!: Relation<User>;

  @ManyToOne(() => User, { nullable: false })
  creator!: Relation<User>;

  @CreateDateColumn({ nullable: false })
  createdAt!: Date;

  @UpdateDateColumn({ nullable: false })
  updatedAt!: Date;

  @DeleteDateColumn()
  deletedAt!: Date;
}
