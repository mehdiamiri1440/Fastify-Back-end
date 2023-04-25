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

const WarehouseSchemaWithoutRelations = Type.Omit(WarehouseSchema, ['creator']);

@Entity()
export class Warehouse
  implements Static<typeof WarehouseSchemaWithoutRelations>
{
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ nullable: false })
  name!: string;

  @Column({ nullable: false })
  province!: string;

  @Column({ nullable: false })
  city!: string;

  @Column({ nullable: false })
  street!: string;

  @OneToMany(
    () => WarehouseStaff,
    (warehouseStaffs) => warehouseStaffs.warehouse,
  )
  warehouseStaffs!: Relation<WarehouseStaff>;

  @Column({ nullable: false })
  postalCode!: string;

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  @ManyToOne(() => User)
  creator!: Relation<User>;

  @CreateDateColumn({ nullable: false })
  createdAt!: Date;

  @UpdateDateColumn({ nullable: false })
  updatedAt!: Date;

  @DeleteDateColumn()
  deletedAt!: Date;
}
