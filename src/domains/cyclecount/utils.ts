import { repo } from '$src/infra/utils/repo';
import { Warehouse } from '../warehouse/models/Warehouse';

export function loadUserWarehouse(userId: number) {
  return repo(Warehouse).findOneOrFail({
    relations: {
      warehouseStaffs: {
        user: true,
      },
    },
    where: {
      warehouseStaffs: {
        user: {
          id: userId,
        },
      },
    },
  });
}
