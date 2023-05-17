import { Seeder } from '@jorgebodega/typeorm-seeding';
import { DataSource } from 'typeorm';
import { User } from '$src/domains/user/models/User';
import { Role } from '$src/domains/user/models/Role';
import { Warehouse } from '$src/domains/warehouse/models/Warehouse';

export default class WarehouseSeeder extends Seeder {
  async run(dataSource: DataSource) {
    const creator = await dataSource.getRepository(User).save({
      firstName: 'warehouse creator',
      lastName: 'warehouse creator',
      role: await dataSource.getRepository(Role).save({
        title: 'warehouse creator role',
        isActive: true,
      }),
      nif: 'warehouse creator nif',
      email: 'warehouse@creat.or',
      phoneNumber: 'warehouse creator',
      password: 'warehouse creator',
      position: 'warehouse creator',
      isActive: true,
    });
    await dataSource.getRepository(Warehouse).save({
      name: 'DI Warehouse',
      provinceCode: 'P43',
      cityCode: 'C43.183',
      streetCode: 'S43.183.00057',
      streetName: 'Quatre',
      postalCode: '43894',
      description: 'this is just for test',
      supervisor: creator,
      creator,
    });
  }
}
