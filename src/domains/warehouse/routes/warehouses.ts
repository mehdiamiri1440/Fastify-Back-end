import { ResponseShape } from '$src/infra/Response';
import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';
import { Warehouse } from '../models/Warehouse';
import { repo } from '$src/infra/utils/repo';
import { ListQueryOptions } from '$src/infra/tables/schema_builder';
import { TableQueryBuilder } from '$src/infra/tables/Table';
import { Type } from '@sinclair/typebox';
import { WarehouseSchema } from '../schemas/warehouse.schema';
import { User } from '$src/domains/user/models/User';
import { getStreets } from '$src/domains/geo/service';
import createError from '@fastify/error';
const STREET_NAME_NOT_FOUND = createError(
  'STREET_NAME_NOT_FOUND',
  'we can not find name of this street code',
  404,
);

const Warehouses = repo(Warehouse);
const Users = repo(User);

const plugin: FastifyPluginAsyncTypebox = async function (app) {
  app.register(ResponseShape);

  app.route({
    method: 'GET',
    url: '/',
    schema: {
      security: [
        {
          OAuth2: ['warehouse@warehouse::list'],
        },
      ],
      querystring: ListQueryOptions({
        filterable: [
          'province',
          'cityCode',
          'streetCode',
          'streetName',
          'postalCode',
          'supervisor.fullName',
        ],
        orderable: [
          'name',
          'province',
          'cityCode',
          'streetCode',
          'streetName',
          'postalCode',
          'supervisor.fullName',
        ],
        searchable: [
          'name',
          'province',
          'cityCode',
          'streetCode',
          'streetName',
          'postalCode',
          'supervisor.fullName',
        ],
      }),
    },
    async handler(req) {
      return new TableQueryBuilder(Warehouses, req)
        .relation(() => ({ creator: true }))
        .exec();
    },
  });

  app.route({
    method: 'GET',
    url: '/:id',
    schema: {
      params: Type.Object({
        id: Type.Number(),
      }),
      security: [
        {
          OAuth2: ['warehouse@warehouse::list'],
        },
      ],
    },
    async handler(req) {
      const { id } = req.params;

      return Warehouses.findOneOrFail({
        where: {
          id,
        },
        relations: {
          supervisor: true,
          creator: true,
        },
      });
    },
  });

  app.route({
    method: 'POST',
    url: '/',
    schema: {
      security: [
        {
          OAuth2: ['warehouse@warehouse::create'],
        },
      ],
      body: Type.Omit(WarehouseSchema, [
        'id',
        'streetName',
        'creator',
        'createdAt',
        'updatedAt',
        'deletedAt',
      ]),
    },
    async handler(req) {
      // validate references
      const supervisor = await Users.findOneByOrFail({
        id: req.body.supervisor,
      });

      // get detail by street code to use street name
      const { streets } = await getStreets(
        new URLSearchParams({
          filter: `filter[code]=${req.body.streetCode}`,
          include: 'false',
          page: '0',
          size: '1',
        }),
      );
      if (streets.length !== 1) throw new STREET_NAME_NOT_FOUND();
      const street = streets[0];

      return await Warehouses.save({
        ...req.body,
        supervisor,
        streetName: street.formated_name, // use street name
      });
    },
  });

  app.route({
    method: 'PUT',
    url: '/:id',
    schema: {
      security: [
        {
          OAuth2: ['warehouse@warehouse::update'],
        },
      ],
      body: Type.Omit(WarehouseSchema, [
        'id',
        'streetName',
        'creator',
        'createdAt',
        'updatedAt',
        'deletedAt',
      ]),
      params: Type.Object({
        id: Type.Number(),
      }),
    },
    async handler(req) {
      // validate references
      const { id } = await Warehouses.findOneByOrFail({ id: req.params.id });
      const supervisor = await Users.findOneByOrFail({
        id: req.body.supervisor,
      });

      // get detail by street code to use street name
      const { streets } = await getStreets(
        new URLSearchParams({
          filter: `filter[code]=${req.body.streetCode}`,
          include: 'false',
          page: '0',
          size: '1',
        }),
      );
      if (streets.length !== 1) throw new STREET_NAME_NOT_FOUND();
      const street = streets[0];

      await Warehouses.update(
        { id },
        { ...req.body, supervisor, streetName: street.formated_name },
      );
    },
  });
  app.route({
    method: 'DELETE',
    url: '/:id',
    schema: {
      security: [
        {
          OAuth2: ['warehouse@warehouse::delete'],
        },
      ],
      params: Type.Object({
        id: Type.Number(),
      }),
    },
    async handler(req) {
      const { id } = await Warehouses.findOneByOrFail({ id: req.params.id });
      await Warehouses.delete({ id });
    },
  });
};

export default plugin;
