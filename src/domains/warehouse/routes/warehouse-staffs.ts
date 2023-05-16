import { ResponseShape } from '$src/infra/Response';
import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';
import { Warehouse } from '../models/Warehouse';
import { repo } from '$src/infra/utils/repo';
import { ListQueryOptions } from '$src/infra/tables/schema_builder';
import { TableQueryBuilder } from '$src/infra/tables/Table';
import { Type } from '@sinclair/typebox';
import { WarehouseStaff } from '$src/domains/warehouse/models/WarehouseStaff';
import { User } from '$src/domains/user/models/User';
import { WarehouseStaffSchema } from '$src/domains/warehouse/schemas/warehouse-staff';
import { IsNull } from 'typeorm';
const Warehouses = repo(Warehouse);
const WarehouseStaffs = repo(WarehouseStaff);
const Users = repo(User);

const plugin: FastifyPluginAsyncTypebox = async function (app) {
  app.register(ResponseShape);

  app.route({
    method: 'GET',
    url: '/',
    schema: {
      security: [
        {
          OAuth2: ['warehouse@warehouse::update'],
        },
      ],
      querystring: ListQueryOptions({
        filterable: ['warehouse.id', 'user.id'],
        orderable: ['warehouse.id', 'user.id'],
        searchable: ['warehouse.id', 'user.id'],
      }),
    },
    async handler(req) {
      return new TableQueryBuilder(WarehouseStaffs, req)
        .relation(() => ({ user: true, warehouse: true, creator: true }))
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
      body: Type.Omit(WarehouseStaffSchema, [
        'id',
        'creator',
        'createdAt',
        'updatedAt',
        'deletedAt',
      ]),
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
      const { id } = await WarehouseStaffs.findOneByOrFail({
        id: req.params.id,
      });
      await WarehouseStaffs.delete({ id });
    },
  });
};

export default plugin;
