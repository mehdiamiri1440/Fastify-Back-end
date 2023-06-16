import { Seeder } from '@jorgebodega/typeorm-seeding';
import { DataSource } from 'typeorm';
import { Language } from '$src/domains/supplier/models/Language';
import { Supplier } from '$src/domains/supplier/models/Supplier';
import { User } from '$src/domains/user/models/User';
import { Role } from '$src/domains/user/models/Role';
import { SupplierContact } from '$src/domains/supplier/models/Contact';
import { SupplierDocument } from '$src/domains/supplier/models/Documents';

export default class SupplierSeeder extends Seeder {
  async run(dataSource: DataSource) {
    const creator = await dataSource.getRepository(User).save({
      firstName: 'supplier creator',
      lastName: 'supplier creator',
      role: await dataSource.getRepository(Role).save({
        title: 'supplier creator role',
        isActive: true,
      }),
      nif: 'supplier creator nif',
      email: 'supplier@creat.or',
      phoneNumber: 'supplier creator',
      password: 'supplier creator',
      position: 'supplier creator',
      isActive: true,
    });
    const supplier = await dataSource.getRepository(Supplier).save({
      name: 'good supplier',
      cif: 'cif',
      language: await dataSource.getRepository(Language).save({
        title: 'SPN',
      }),
      iban: 'iban',
      email: 'good@suppli.er',
      phoneNumber: '00989012223344',
      accountNumber: 'accountNumber',
      creator,
    });
    await dataSource.getRepository(SupplierContact).save({
      supplier,
      name: 'name',
      surName: 'surName',
      position: 'position',
      email: 'email',
      phoneNumber: 'phoneNumber',
      creator,
    });
  }
}
