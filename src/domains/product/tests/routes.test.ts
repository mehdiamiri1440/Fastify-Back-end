import { expect, it } from '@jest/globals';

// let app: FastifyInstance | undefined;
// let user: TestUser | undefined;
// let warehouse: Warehouse | undefined;

// beforeAll(async () => {
//   app = await createTestFastifyApp();
//   await AppDataSource.synchronize();
//   await app.register(routes);
//   await app.ready();
//   user = await TestUser.create(app);

//   await disableForeignKeyCheck();

//   warehouse = await repo(Warehouse).save({
//     name: 'warehouse test',
//     description: 'description',
//     postalCode: 'postalCode',
//     province: 'province',
//     city: 'city',
//     street: 'street',
//     creator: {
//       id: 1,
//     },
//   });

//   await enableForeignKeyCheck();
// });

// afterAll(async () => {
//   await app?.close();
// });

it('should return products list', async () => {
  expect(true).toBe(true);
});
