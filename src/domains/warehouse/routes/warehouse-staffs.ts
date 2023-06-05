import { User } from '$src/domains/user/models/User';
import { WarehouseStaff } from '$src/domains/warehouse/models/WarehouseStaff';
import { WarehouseStaffSchema } from '$src/domains/warehouse/schemas/warehouse-staff';
import { ResponseShape } from '$src/infra/Response';
import { OrderBy, PaginatedQueryString } from '$src/infra/tables/PaginatedType';
import { TableQueryBuilder } from '$src/infra/tables/Table';
import { repo } from '$src/infra/utils/repo';
import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';
import { Type } from '@sinclair/typebox';
import { IsNull } from 'typeorm';
import { Warehouse } from '../models/Warehouse';

const plugin: FastifyPluginAsyncTypebox = async function (app) {
  app.register(ResponseShape);

  const Warehouses = repo(Warehouse);
  const WarehouseStaffs = repo(WarehouseStaff);
  const Users = repo(User);

  app.route({
    method: 'GET',
    url: '/',
    schema: {
      security: [
        {
          OAuth2: ['warehouse@warehouse::update'],
        },
      ],
      querystring: PaginatedQueryString({
        orderBy: OrderBy(['warehouse.id', 'user.id']),
      }),
    },
    async handler(req) {
      return new TableQueryBuilder(WarehouseStaffs, req)
        .relation({ user: true, warehouse: true, creator: true })
        .exec();
    },
  });

  app.route({
    method: 'GET',
    url: '/available',
    schema: {
      security: [
        {
          OAuth2: ['warehouse@warehouse::update'],
        },
      ],
    },
    async handler(req) {
      return await Users.find({
        where: { staffWarehouses: { id: IsNull() } },
        relations: { staffWarehouses: true },
      });
    },
  });

  app.route({
    method: 'POST',
    url: '/',
    schema: {
      security: [
        {
          OAuth2: ['warehouse@warehouse::update'],
        },
      ],
      body: Type.Pick(WarehouseStaffSchema, ['warehouse', 'user']),
    },
    async handler(req) {
      // validating references
      const user = await Users.findOneByOrFail({
        id: req.body.user,
        staffWarehouses: { id: IsNull() },
      });
      const warehouse = await Warehouses.findOneByOrFail({
        id: req.body.warehouse,
      });

      return await WarehouseStaffs.save({
        user,
        warehouse,
        creator: { id: req.user.id },
      });
    },
  });

  app.route({
    method: 'DELETE',
    url: '/:id',
    schema: {
      security: [
        {
          OAuth2: ['warehouse@warehouse::update'],
        },
      ],
      params: Type.Object({
        id: Type.Number(),
      }),
    },
    async handler(req) {
      const ws = await WarehouseStaffs.findOneByOrFail({
        id: req.params.id,
      });
      await WarehouseStaffs.softRemove(ws);
    },
  });
};

export default plugin;
