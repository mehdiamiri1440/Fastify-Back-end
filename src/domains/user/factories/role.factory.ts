import { faker } from '@faker-js/faker';
import { Role } from '$src/domains/user/models/Role';
import { Factory } from '@danielsoheil/typeorm-better-factory';

export class RoleFactory extends Factory<Role> {
  entity = Role;
  title = faker.word.sample();
  isActive = true;
}
