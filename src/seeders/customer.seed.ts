import { Seeder } from '@jorgebodega/typeorm-seeding';
import { DataSource } from 'typeorm';
import { Nationality } from '$src/domains/customer/models/Nationality';

export default class customerSeeder extends Seeder {
  async run(dataSource: DataSource) {
    await dataSource.getRepository(Nationality).save({
      title: 'SPN',
    });
  }
}
