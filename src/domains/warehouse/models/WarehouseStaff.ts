import { User } from '$src/domains/user/models/User';
import {
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  Relation,
  Unique,
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
@Unique(['user', 'warehouse'])
export class WarehouseStaff
  implements Static<typeof WarehouseStaffSchemaWithoutRelations>
{
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => User, { nullable: false })
  user!: Relation<User>;

  @ManyToOne(() => Warehouse, { nullable: false })
  warehouse!: Relation<Warehouse>;

  @ManyToOne(() => User, { nullable: false })
  creator!: Relation<User>;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @DeleteDateColumn()
  deletedAt!: Date;
}
