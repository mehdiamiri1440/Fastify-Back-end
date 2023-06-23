import { faker } from '@faker-js/faker';
import { Factory, SubFactory } from '@danielsoheil/typeorm-better-factory';
import { WarehouseFactory } from '$src/domains/warehouse/factories/warehouse.factory';
import { UserFactory } from '$src/domains/user/factories/user.factory';
import { Bin } from '$src/domains/warehouse/models/Bin';
import { BinSizeFactory } from '$src/domains/warehouse/factories/bin-size.factory';
import { BinPropertyFactory } from '$src/domains/warehouse/factories/bin-property.factory';

export class BinFactory extends Factory<Bin> {
  entity = Bin;
  name = faker.word.sample();
  warehouse = new SubFactory(WarehouseFactory);
  size = new SubFactory(BinSizeFactory);
  property = new SubFactory(BinPropertyFactory);
  physicalCode = faker.internet.password();
  internalCode = faker.internet.password();
  isActive = true;
  creator = new SubFactory(UserFactory);
}
