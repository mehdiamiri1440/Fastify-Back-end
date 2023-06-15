import { User } from '$src/domains/user/models/User';
import { faker } from '@faker-js/faker';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { NormalRoleFactory } from '$src/domains/user/factories/role.factory';

export class NormalUserFactory {
  repo: Repository<User>;
  roleFactory: NormalRoleFactory;

  constructor(dataSource: DataSource | EntityManager) {
    this.repo = dataSource.getRepository(User);
    this.roleFactory = new NormalRoleFactory(dataSource);
  }

  create = async () => {
    return await this.repo.save({
      firstName: faker.person.firstName(),
      lastName: faker.person.lastName(),
      role: await this.roleFactory.create(),
      email: faker.internet.email(),
      nif: faker.internet.password(),
      phoneNumber: faker.phone.number(),
      password: faker.internet.password(),
      position: faker.person.jobTitle(),
      isActive: true,
    });
  };
}
