import { Seeder } from '@jorgebodega/typeorm-seeding';
import { DataSource } from 'typeorm';
import { User } from '$src/domains/user/models/User';
import { Role } from '$src/domains/user/models/Role';
import { Product } from '$src/domains/product/models/Product';
import { TaxType } from '$src/domains/product/models/TaxType';
import { Unit } from '$src/domains/configuration/models/Unit';
import { Category } from '$src/domains/configuration/models/Category';
import { Shape } from '$src/domains/configuration/models/Shape';
import { Color } from '$src/domains/configuration/models/Color';
import { Brand } from '$src/domains/configuration/models/Brand';
import { Size } from '$src/domains/product/models/Size';

export default class ProductSeeder extends Seeder {
  async run(dataSource: DataSource) {
    const creator = await dataSource.getRepository(User).save({
      firstName: 'product creator',
      lastName: 'product creator',
      role: await dataSource.getRepository(Role).save({
        title: 'product creator role',
        isActive: true,
      }),
      nif: 'product creator nif',
      email: 'product@creat.or',
      phoneNumber: 'product creator',
      password: 'product creator',
      position: 'product creator',
      isActive: true,
    });
    await dataSource.getRepository(Product).save({
      name: 'name',
      barcode: 'barcode',
      invoiceSystemCode: 1,
      description: 'description',
      weight: 1,
      taxType: await dataSource.getRepository(TaxType).save({
        title: '1234',
        creator,
      }),
      unit: await dataSource.getRepository(Unit).save({
        name: 'name',
        creator,
      }),
      category: await dataSource.getRepository(Category).save({
        name: 'name',
        creator,
      }),
      shape: await dataSource.getRepository(Shape).save({
        name: 'name',
        creator,
      }),
      color: await dataSource.getRepository(Color).save({
        name: 'name',
        code: 'code',
        creator,
      }),
      brand: await dataSource.getRepository(Brand).save({
        name: 'name',
        creator,
      }),
      size: await dataSource.getRepository(Size).save({
        title: 'sml',
        width: 1,
        height: 1,
        creator,
      }),
      creator,
    });
  }
}
