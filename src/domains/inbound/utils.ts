import { WarehouseService } from '../warehouse/services/Warehouse.service';
import { NOT_IN_WAREHOUSE } from './errors';

const warehouseService = new WarehouseService();

export async function loadUserWarehouse(userId: number) {
  const warehouse = await warehouseService.findWarehouseOfUser(userId);
  if (!warehouse) throw new NOT_IN_WAREHOUSE();
  return warehouse;
}
