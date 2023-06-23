import { faker } from '@faker-js/faker';
import { Warehouse } from '$src/domains/warehouse/models/Warehouse';
import { Factory, SubFactory } from '@danielsoheil/typeorm-better-factory';
import { UserFactory } from '$src/domains/user/factories/user.factory';

export class WarehouseFactory extends Factory<Warehouse> {
  entity = Warehouse;
  name = faker.word.sample();
  address = {
    provinceCode: 'P43',
    provinceName: 'TARRAGONA',
    cityCode: 'C07.062',
    cityName: 'SON SERVERA',
    streetCode: 'S07.046.00561',
    streetName: faker.location.street(),
    postalCode: '43716',
    numberCode: 'N07.046.00097.00006.3165209CD5136N',
    number: '6',
    building: null,
    stairway: null,
    floor: null,
    door: null,
    latitude: null,
    longitude: null,
  };
  supervisor = new SubFactory(UserFactory);
  creator = new SubFactory(UserFactory);
}
