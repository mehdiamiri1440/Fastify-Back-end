import { User } from '$src/domains/user/models/User';
import { WarehouseStaffSchema } from '$src/domains/warehouse/schemas/warehouse-staff';
import { Static, Type } from '@sinclair/typebox';
import {
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  ManyToOne,
  PrimaryGeneratedColumn,
  Relation,
  UpdateDateColumn,
} from 'typeorm';
import { Warehouse } from './Warehouse';

const WarehouseStaffSchemaWithoutRelations = Type.Omit(WarehouseStaffSchema, [
  'user',
  'warehouse',
  'creator',
]);

@Entity()
@Index(['user', 'warehouse'], { where: `deleted_at IS NULL` })
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
