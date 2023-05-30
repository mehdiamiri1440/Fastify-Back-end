import { Seeder } from '@jorgebodega/typeorm-seeding';
import { DataSource } from 'typeorm';
import { Nationality } from '$src/domains/customer/models/Nationality';
import { Customer } from '$src/domains/customer/models/Customer';
import { User } from '$src/domains/user/models/User';
import { Role } from '$src/domains/user/models/Role';
import { CustomerContact } from '$src/domains/customer/models/Contact';

export default class CustomerSeeder extends Seeder {
  async run(dataSource: DataSource) {
    const creator = await dataSource.getRepository(User).save({
      firstName: 'customer creator',
      lastName: 'customer creator',
      role: await dataSource.getRepository(Role).save({
        title: 'customer creator role',
        isActive: true,
      }),
      nif: 'customer creator nif',
      email: 'customer@creat.or',
      phoneNumber: 'customer creator',
      password: 'customer creator',
      position: 'customer creator',
      isActive: true,
    });

    const customer = await dataSource.getRepository(Customer).save({
      name: 'name',
      businessName: 'businessName',
      subscriberType: 'empresa',
      documentType: 'dni',
      businessDocumentType: 'dni',
      fiscalId: 'fiscalId',
      businessFiscalId: 'businessFiscalId',
      contactFamily1: 'contactFamily1',
      contactFamily2: 'contactFamily2',
      nationality: await dataSource.getRepository(Nationality).save({
        title: 'SPN',
      }),
      birthday: 'birthday',
      isActive: true,
      creator,
      address: {
        door: '7',
        floor: '3',
        number: '1',
        building: 'Prans',
        cityCode: 'Shiraz',
        cityName: 'Shiraz',
        latitude: 1.222334123,
        stairway: 'edited',
        formatted: 'Fars Shiraz Hedayat 123456 1 3-7',
        longitude: 2.222334124,
        postalCode: '123456',
        streetCode: 'Hedayat',
        streetName: 'Hedayat',
        provinceCode: 'Fars',
        provinceName: 'Fars',
      },
    });
    await dataSource.getRepository(CustomerContact).save({
      customer,
      name: 'name',
      surName: 'surName',
      position: 'position',
      phoneNumber: 'phoneNumber',
      email: 'email',
      creator,
    });
  }
}
