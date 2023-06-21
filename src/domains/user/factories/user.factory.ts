import { User } from '$src/domains/user/models/User';
import { faker } from '@faker-js/faker';
import { RoleFactory } from '$src/domains/user/factories/role.factory';
import { Factory, SubFactory } from '@danielsoheil/typeorm-better-factory';

export class UserFactory extends Factory<User> {
  entity = User;
  firstName = faker.person.firstName();
  lastName = faker.person.lastName();
  role = new SubFactory(RoleFactory);
  email = faker.internet.email();
  nif = faker.internet.password();
  phoneNumber = faker.phone.number();
  password = faker.internet.password();
  position = faker.person.jobTitle();
  isActive = true;
}
