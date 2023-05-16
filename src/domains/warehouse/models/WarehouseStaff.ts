import { User } from '$src/domains/user/models/User';
import {
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  Relation,
  UpdateDateColumn,
} from 'typeorm';
import { Warehouse } from './Warehouse';
import { Static, Type } from '@sinclair/typebox';
import { WarehouseStaffSchema } from '$src/domains/warehouse/schemas/warehouse-staff';

const WarehouseStaffSchemaWithoutRelations = Type.Omit(WarehouseStaffSchema, [
  'user',
  'warehouse',
  'creator',
]);

@Entity()
export class WarehouseStaff
  implements Static<typeof WarehouseStaffSchemaWithoutRelations>
{
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => User)
  user!: Relation<User>;

  @ManyToOne(() => Warehouse)
  warehouse!: Relation<Warehouse>;

  @ManyToOne(() => User)
  creator!: Relation<User>;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @DeleteDateColumn()
  deletedAt!: Date;
}
