import { ResponseShape } from '$src/infra/Response';
import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';
import { Supplier } from '../../models/Supplier';
import { Language } from '../../models/Language';
import { repo } from '$src/infra/utils/repo';
import { ListQueryOptions } from '$src/infra/tables/schema_builder';
import { TableQueryBuilder } from '$src/infra/tables/Table';
import { SupplierSchema } from '$src/domains/supplier/schemas/supplier.schema';
import { Type } from '@sinclair/typebox';
import ibanValidator from '$src/infra/ibanValidator';

const plugin: FastifyPluginAsyncTypebox = async function (app) {
  app.register(ResponseShape);
  const Suppliers = repo(Supplier);
  const Languages = repo(Language);

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
        orderable: ['id', 'name'],
        searchable: ['id', 'name'],
      }),
    },
    async handler(req) {
      return new TableQueryBuilder(Suppliers, req)
        .relation({
          creator: true,
        })
        .loadRelationIds({
          disableMixedMap: false,
        })
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
          OAuth2: ['supplier@supplier::list'],
        },
      ],
    },
    async handler(req) {
      const { id } = req.params;

      return Suppliers.findOneOrFail({
        where: {
          id,
        },
        relations: {
          creator: true,
          language: true,
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
          OAuth2: ['supplier@supplier::create'],
        },
      ],
      body: Type.Omit(SupplierSchema, [
        'id',
        'bic',
        'bankName',
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

      // validating iban
      const { bic, bankName } = await ibanValidator(req.body.iban);

      return await Suppliers.save({
        ...req.body,
        bic,
        bankName,
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
        'bic',
        'bankName',
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

      // validating iban
      const { bic, bankName } = await ibanValidator(req.body.iban);

      const { id } = await Suppliers.findOneByOrFail({ id: req.params.id });
      await Suppliers.update({ id }, { ...req.body, bic, bankName, language });
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
      await Suppliers.softDelete({ id });
    },
  });

  await app.register(import('./contacts'));
  await app.register(import('./documents'));
  await app.register(import('./products'));
};

export default plugin;
