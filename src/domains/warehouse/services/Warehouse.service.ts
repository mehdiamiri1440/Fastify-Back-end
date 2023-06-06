import AppDataSource from '$src/DataSource';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { Warehouse } from '../models/Warehouse';

export class WarehouseService {
  #warehouseRepo: Repository<Warehouse>;

  constructor(dataSource: DataSource | EntityManager = AppDataSource) {
    this.#warehouseRepo = dataSource.getRepository(Warehouse);
  }

  async findWarehouseOfUser(userId: number) {
    const warehouse = await this.#warehouseRepo.findOne({
      select: {
        id: true,
        name: true,
      },
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

    return warehouse;
  }
}
