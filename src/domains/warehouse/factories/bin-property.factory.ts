import { faker } from '@faker-js/faker';
import { Factory, SubFactory } from '@danielsoheil/typeorm-better-factory';
import { UserFactory } from '$src/domains/user/factories/user.factory';
import { BinProperty } from '$src/domains/warehouse/models/BinProperty';

export class BinPropertyFactory extends Factory<BinProperty> {
  entity = BinProperty;
  title = faker.word.sample();
  creator = new SubFactory(UserFactory);
}
