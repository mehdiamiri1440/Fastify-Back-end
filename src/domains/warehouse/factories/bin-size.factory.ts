import { faker } from '@faker-js/faker';
import { Factory, SubFactory } from '@danielsoheil/typeorm-better-factory';
import { UserFactory } from '$src/domains/user/factories/user.factory';
import { BinSize } from '$src/domains/warehouse/models/BinSize';

export class BinSizeFactory extends Factory<BinSize> {
  entity = BinSize;
  title = faker.word.sample();
  width = faker.number.int({ min: 1, max: 100 });
  height = faker.number.int({ min: 1, max: 100 });
  depth = faker.number.int({ min: 1, max: 100 });
  creator = new SubFactory(UserFactory);
}
