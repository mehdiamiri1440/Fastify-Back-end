import AppDataSource from '$src/DataSource';
import { User } from '$src/domains/user/models/User';
import '$src/infra/test/statusCodeExpect';
import {
  createTestFastifyApp,
  withoutForeignKeyCheck,
  TestUser,
} from '$src/infra/test/utils';
import { repo } from '$src/infra/utils/repo';
import { afterEach, beforeEach, expect, it } from '@jest/globals';
import assert from 'assert';
import { FastifyInstance } from 'fastify';
import routes from './routes';
import { Role } from '$src/domains/user/models/Role';
import { BinProduct } from '$src/domains/product/models/BinProduct';
import { Bin } from '$src/domains/warehouse/models/Bin';
import { Product } from '$src/domains/product/models/Product';
import { BIN_HAVE_PRODUCT } from '$src/domains/warehouse/errors';
import { Warehouse } from './models/Warehouse';
import { WarehouseStaff } from './models/WarehouseStaff';

let app: FastifyInstance | undefined;
let user: TestUser | undefined;

const sizeData = {
  title: 'big',
  width: 1,
  height: 2,
  depth: 3,
};
const propertyData = {
  title: 'normal',
};
const warehouseData = {
  name: 'DI Warehouse',
  address: {
    provinceName: 'Fars',
    provinceCode: 'Fars',
    cityName: 'Shiraz',
    cityCode: 'Shiraz',
    streetName: 'Hedayat',
    streetCode: 'Hedayat',
    postalCode: '123456',
    number: '1',
    numberCode: 'blahblah.1',
    building: 'Prans',
    stairway: 'test',
    floor: '3',
    door: '7',
    latitude: 1.222334123,
    longitude: 2.222334124,
  },
  description: 'this is just for test',
};
const binData = {
  name: 'DI Bin',
  physicalCode: 'physicalCode',
  internalCode: 'internalCode',
  description: 'this is just for test',
};
const userData = {
  firstName: 'Daniel',
  lastName: 'Soheil',
  nif: 'B-6116622G',
  email: 'daniel@sohe.ir',
  phoneNumber: '+989303590055',
  password: 'hackme',
  position: 'Developer',
  isActive: true,
};

beforeEach(async () => {
  app = await createTestFastifyApp();
  await AppDataSource.synchronize();
  await app.register(routes);
  await app.ready();
  user = await TestUser.create(app);
});

afterEach(async () => {
  await app?.close();
});

it('warehouse flow', async () => {
  assert(app);
  assert(user);
  let sizeId: number;
  let propertyId: number;
  let warehouseId: number;
  let binId: number;
  const userId: number = (
    await repo(User).save({
      ...userData,
      role: await repo(Role).save({ title: 'testxg', isActive: true }),
    })
  ).id;
  let staffId: number;

  {
    // should create a bin size
    const response = await user.inject({
      method: 'POST',
      url: '/bin-sizes',
      payload: sizeData,
    });
    expect(response.json()).toMatchObject({
      data: {
        id: expect.any(Number),
        ...sizeData,
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
        deletedAt: null,
      },
      meta: {},
    });
    sizeId = response.json().data.id;
  }
  {
    // should get bin size by id
    const response = await user.inject({
      method: 'GET',
      url: '/bin-sizes/' + sizeId,
    });
    expect(response.json().data).toMatchObject({
      id: sizeId,
      ...sizeData,
      createdAt: expect.any(String),
      updatedAt: expect.any(String),
      deletedAt: null,
    });
  }
  {
    // should get list of bin sizes
    const response = await user.inject({
      method: 'GET',
      url: '/bin-sizes/',
    });
    expect(response.json().data).toMatchObject(
      expect.arrayContaining([
        expect.objectContaining({
          id: sizeId,
          ...sizeData,
          createdAt: expect.any(String),
          updatedAt: expect.any(String),
          deletedAt: null,
        }),
      ]),
    );
  }
  {
    // should update a bin size
    const response = await user.inject({
      method: 'PUT',
      url: '/bin-sizes/' + sizeId,
      payload: { ...sizeData, title: 'edited' },
    });

    expect(response).statusCodeToBe(200);
  }
  {
    // should create a bin property
    const response = await user.inject({
      method: 'POST',
      url: '/bin-properties',
      payload: propertyData,
    });
    propertyId = response.json().data.id;
    expect(response.json()).toMatchObject({
      data: {
        id: propertyId,
        ...propertyData,
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
        deletedAt: null,
      },
      meta: {},
    });
  }
  {
    // should get bin property by id
    const response = await user.inject({
      method: 'GET',
      url: '/bin-properties/' + propertyId,
    });
    expect(response.json().data).toMatchObject({
      id: propertyId,
      ...propertyData,
      createdAt: expect.any(String),
      updatedAt: expect.any(String),
      deletedAt: null,
    });
  }
  {
    // should get list of bin properties
    const response = await user.inject({
      method: 'GET',
      url: '/bin-properties',
    });
    expect(response.json().data).toMatchObject(
      expect.arrayContaining([
        expect.objectContaining({
          id: propertyId,
          ...propertyData,
          createdAt: expect.any(String),
          updatedAt: expect.any(String),
          deletedAt: null,
        }),
      ]),
    );
  }
  {
    // should update a bin property
    const response = await user.inject({
      method: 'PUT',
      url: '/bin-properties/' + propertyId,
      payload: { ...propertyData, title: 'edited' },
    });

    expect(response).statusCodeToBe(200);
  }
  {
    // should create a warehouse
    const response = await user.inject({
      method: 'POST',
      url: '/warehouses',
      payload: { ...warehouseData, supervisor: userId },
    });
    expect(response.json()).toMatchObject({
      data: {
        id: expect.any(Number),
        ...warehouseData,
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
        deletedAt: null,
      },
      meta: {},
    });
    warehouseId = response.json().data.id;
  }
  {
    // should get list of warehouses
    const response = await user.inject({
      method: 'GET',
      url: '/warehouses',
    });
    expect(response.json().data).toMatchObject(
      expect.arrayContaining([
        expect.objectContaining({
          id: warehouseId,
          ...warehouseData,
          createdAt: expect.any(String),
          updatedAt: expect.any(String),
          deletedAt: null,
        }),
      ]),
    );
  }
  {
    // should get a warehouse
    const response = await user.inject({
      method: 'GET',
      url: '/warehouses/' + warehouseId,
    });

    expect(response).statusCodeToBe(200);
    expect(response.json().data).toMatchObject({
      id: warehouseId,
      ...warehouseData,
      createdAt: expect.any(String),
      updatedAt: expect.any(String),
      deletedAt: null,
    });
  }
  {
    // should update a warehouse
    const response = await user.inject({
      method: 'PUT',
      url: '/warehouses/' + warehouseId,
      payload: { ...warehouseData, supervisor: userId, name: 'edited' },
    });

    expect(response).statusCodeToBe(200);
  }
  {
    // should create a bin
    const response = await user.inject({
      method: 'POST',
      url: '/bins',
      payload: {
        ...binData,
        size: sizeId,
        property: propertyId,
        warehouse: warehouseId,
      },
    });
    binId = response.json().data.id;
    expect(response.json()).toMatchObject({
      data: {
        id: binId,
        ...binData,
        size: { ...sizeData, title: 'edited' },
        property: { ...propertyData, title: 'edited' },
        warehouse: { ...warehouseData, name: 'edited' },
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
        deletedAt: null,
      },
      meta: {},
    });
  }
  {
    // should get bin by id
    const response = await user.inject({
      method: 'GET',
      url: '/bins/' + binId,
    });
    expect(response.json().data).toMatchObject({
      id: binId,
      ...binData,
      createdAt: expect.any(String),
      updatedAt: expect.any(String),
      deletedAt: null,
    });
  }
  {
    // should get list of bin
    const response = await user.inject({
      method: 'GET',
      url: '/bins',
    });
    expect(response.json().data).toMatchObject(
      expect.arrayContaining([
        expect.objectContaining({
          id: binId,
          ...binData,
          size: expect.objectContaining({ id: sizeId }),
          property: expect.objectContaining({ id: propertyId }),
          warehouse: expect.objectContaining({ id: warehouseId }),
          createdAt: expect.any(String),
          updatedAt: expect.any(String),
          deletedAt: null,
        }),
      ]),
    );
  }
  {
    // should update a bin
    const response = await user.inject({
      method: 'PUT',
      url: '/bins/' + binId,
      payload: {
        ...binData,
        size: sizeId,
        property: propertyId,
        warehouse: warehouseId,
        name: 'edited',
      },
    });

    expect(response).statusCodeToBe(200);
  }
  {
    // should delete a bin
    const response = await user.inject({
      method: 'DELETE',
      url: '/bins/' + binId,
    });

    expect(response).statusCodeToBe(200);
  }
  {
    // should delete bin property
    const response = await user.inject({
      method: 'DELETE',
      url: '/bin-properties/' + propertyId,
    });

    expect(response).statusCodeToBe(200);
  }
  {
    // should delete bin size
    const response = await user.inject({
      method: 'DELETE',
      url: '/bin-sizes/' + sizeId,
    });

    expect(response).statusCodeToBe(200);
  }
  {
    // check that our user is available for staff
    const response = await user.inject({
      method: 'GET',
      url: '/warehouse-staffs/available',
    });
    expect(response.json().data).toMatchObject(
      expect.arrayContaining([expect.objectContaining(userData)]),
    );
  }
  {
    // should create a staff for warehouse
    const response = await user.inject({
      method: 'POST',
      url: '/warehouse-staffs',
      payload: {
        user: userId,
        warehouse: warehouseId,
      },
    });
    expect(response.json()).toMatchObject({
      data: {
        user: { ...userData },
        warehouse: { ...warehouseData, name: 'edited' },
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
        deletedAt: null,
      },
      meta: {},
    });
    staffId = response.json().data.id;
  }
  {
    // should not create a not available staff for warehouse
    const response = await user.inject({
      method: 'POST',
      url: '/warehouse-staffs',
      payload: {
        user: userId,
        warehouse: warehouseId,
      },
    });
    expect(response.statusCode).not.toBe(200);
  }
  {
    // check that our user is not available for staff
    const response = await user.inject({
      method: 'GET',
      url: '/warehouse-staffs/available',
    });
    expect(response.json().data).not.toMatchObject(
      expect.arrayContaining([expect.objectContaining(userData)]),
    );
  }
  {
    // should get list staffs assigned to a warehouse
    const response = await user.inject({
      method: 'GET',
      url: '/warehouse-staffs',
    });
    expect(response.json().data).toMatchObject([
      {
        id: staffId,
        user: { ...userData },
        warehouse: { ...warehouseData, name: 'edited' },
        creator: {},
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
        deletedAt: null,
      },
    ]);
  }
  {
    // should delete a bin
    const response = await user.inject({
      method: 'DELETE',
      url: '/warehouse-staffs/' + staffId,
    });

    expect(response).statusCodeToBe(200);
  }
  {
    // should get empty list of staffs assigned to a warehouse
    const response = await user.inject({
      method: 'GET',
      url: '/warehouse-staffs',
    });
    expect(response.json().data).toMatchObject([]);
  }
  {
    // should not delete a bin
    const response = await user.inject({
      method: 'DELETE',
      url: '/warehouse-staffs/' + staffId,
    });

    expect(response.statusCode).not.toBe(200);
  }
  {
    // should delete a warehouse
    const response = await user.inject({
      method: 'DELETE',
      url: '/warehouses/' + warehouseId,
    });

    expect(response).statusCodeToBe(200);
  }
});

it('should not delete bin when we have product in it', async function () {
  assert(app);
  assert(user);

  const { binProduct } = await withoutForeignKeyCheck(async () => {
    const binProduct = await repo(BinProduct).save({
      bin: await repo(Bin).save({
        name: 'test',
        internalCode: 'test',
        warehouse: { id: 1 },
        size: { id: 1 },
        property: { id: 1 },
        creator: { id: 1 },
      }),
      product: await repo(Product).save({ name: 'test' }),
      quantity: 1,
    });
    return { binProduct };
  });

  const response = await user.inject({
    method: 'DELETE',
    url: '/bins/' + binProduct.bin.id,
  });

  expect(response).statusCodeToBe(400);
  expect(response.json().code).toBe(BIN_HAVE_PRODUCT().code);
});

it('GET /my-warehouse should be working', async () => {
  assert(app);
  assert(user);

  const warehouse = await repo(Warehouse).save({
    name: 'warehouse test',
    description: 'description',
    addressProvinceCode: 'P43',
    addressProvinceName: 'TARRAGONA',
    addressCityCode: 'C07.062',
    addressCityName: 'SON SERVERA',
    addressStreetCode: 'S43.001.00104',
    addressStreetName: 'Alicante  en  ur mas en pares',
    addressPostalCode: '7820',
    addressNumber: '9',
    addressNumberCode: 'N07.046.00097.00009.2965903CD5126N',
    creator: {
      id: 1,
    },
  });

  await repo(WarehouseStaff).save({
    name: 'warehouse test',
    description: 'description',
    user: {
      id: user.id,
    },
    warehouse,
    creator: {
      id: 1,
    },
  });

  const response = await user.inject({
    method: 'GET',
    url: '/my-warehouse',
  });

  expect(response).statusCodeToBe(200);
  expect(response.json().data).toMatchObject({
    id: warehouse.id,
    name: warehouse.name,
  });
});
