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

  @Column({ nullable: false })
  addressProvinceCode!: string;

  @Column({ nullable: false })
  addressProvinceName!: string;

  @Column({ nullable: false })
  addressCityCode!: string;

  @Column({ nullable: false })
  addressCityName!: string;

  @Column({ nullable: false })
  addressStreetCode!: string;

  @Column({ nullable: false })
  addressStreetName!: string;

  @Column({ nullable: false })
  addressPostalCode!: string;

  @Column({ type: 'text', nullable: true })
  addressNumber!: string | null;

  @Column({ type: 'text', nullable: true })
  addressNumberCode!: string | null;

  @OneToMany(
    () => WarehouseStaff,
    (warehouseStaffs) => warehouseStaffs.warehouse,
  )
  warehouseStaffs!: Relation<WarehouseStaff>;

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  @ManyToOne(() => User)
  supervisor!: Relation<User>;

  @ManyToOne(() => User)
  creator!: Relation<User>;

  @CreateDateColumn({ nullable: false })
  createdAt!: Date;

  @UpdateDateColumn({ nullable: false })
  updatedAt!: Date;

  @DeleteDateColumn()
  deletedAt!: Date;
}
