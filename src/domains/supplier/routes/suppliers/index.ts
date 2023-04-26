import { ResponseShape } from '$src/infra/Response';
import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';
import { Supplier } from '../../models/Supplier';
import { Language } from '../../models/Language';
import { repo } from '$src/infra/utils/repo';
import { ListQueryOptions } from '$src/infra/tables/schema_builder';
import { TableQueryBuilder } from '$src/infra/tables/Table';
import { SupplierSchema } from '$src/domains/supplier/schemas/supplier.schema';
import { Type } from '@sinclair/typebox';
const Suppliers = repo(Supplier);
const Languages = repo(Language);

const plugin: FastifyPluginAsyncTypebox = async function (app) {
  app.register(ResponseShape);

  app.route({
    method: 'GET',
    url: '/',
    schema: {
      security: [
        {
          OAuth2: ['supplier@supplier::list'],
        },
      ],
      querystring: ListQueryOptions({
        filterable: ['name'],
        orderable: ['name'],
        searchable: ['name'],
      }),
    },
    async handler(req) {
      return new TableQueryBuilder(Suppliers, req).exec();
    },
  });
  app.route({
    method: 'POST',
    url: '/',
    schema: {
      security: [
        {
          OAuth2: ['supplier@supplier::create'],
        },
      ],
      body: Type.Omit(SupplierSchema, [
        'id',
        'creator',
        'createdAt',
        'updatedAt',
        'deletedAt',
      ]),
    },
    async handler(req) {
      // validating references
      const language = await Languages.findOneByOrFail({
        id: req.body.language,
      });

      return await Suppliers.save({
        ...req.body,
        language,
        creator: { id: req.user.id },
      });
    },
  });

  app.route({
    method: 'PUT',
    url: '/:id',
    schema: {
      security: [
        {
          OAuth2: ['supplier@supplier::update'],
        },
      ],
      body: Type.Omit(SupplierSchema, [
        'id',
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
      // validating references
      const language = await Languages.findOneByOrFail({
        id: req.body.language,
      });

      const { id } = await Suppliers.findOneByOrFail({ id: req.params.id });
      await Suppliers.update({ id }, { ...req.body, language });
    },
  });
  app.route({
    method: 'DELETE',
    url: '/:id',
    schema: {
      security: [
        {
          OAuth2: ['supplier@supplier::delete'],
        },
      ],
      params: Type.Object({
        id: Type.Number(),
      }),
    },
    async handler(req) {
      const { id } = await Suppliers.findOneByOrFail({ id: req.params.id });
      await Suppliers.delete({ id });
    },
  });
  await app.register(import('./contacts'));
  await app.register(import('./documents'));
};

export default plugin;
