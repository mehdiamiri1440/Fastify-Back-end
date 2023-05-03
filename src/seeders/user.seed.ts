import { Seeder } from '@jorgebodega/typeorm-seeding';
import { DataSource } from 'typeorm';
import { User } from '$src/domains/user/models/User';
import { Role } from '$src/domains/user/models/Role';
import bcrypt from 'bcrypt';

export default class UserSeeder extends Seeder {
  async run(dataSource: DataSource) {
    await dataSource.getRepository(User).save({
      firstName: 'root',
      lastName: 'root',
      role: await dataSource.getRepository(Role).save({
        title: 'root',
        isActive: true,
      }),
      nif: 'root',
      email: 'root',
      phoneNumber: 'root',
      password: await bcrypt.hash('root', 10),
      position: 'root',
      isActive: true,
    });
  }
}
