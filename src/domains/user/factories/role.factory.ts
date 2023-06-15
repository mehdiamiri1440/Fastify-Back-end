import { faker } from '@faker-js/faker';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { Role } from '$src/domains/user/models/Role';

export class NormalRoleFactory {
  repo: Repository<Role>;

  constructor(dataSource: DataSource | EntityManager) {
    this.repo = dataSource.getRepository(Role);
  }

  create = async () => {
    return await this.repo.save({
      title: faker.word.sample(),
      isActive: true,
    });
  };
}
