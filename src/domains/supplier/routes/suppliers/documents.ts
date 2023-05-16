import { repo } from '$src/infra/utils/repo';
import { ResponseShape } from '$src/infra/Response';
import { ListQueryOptions } from '$src/infra/tables/schema_builder';
import { TableQueryBuilder } from '$src/infra/tables/Table';
import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';
import { Type } from '@sinclair/typebox';
import { DocumentSchema } from '$src/domains/supplier/schemas/document.schema';
import { SupplierDocument } from '$src/domains/supplier/models/Documents';
import { Supplier } from '$src/domains/supplier/models/Supplier';

const Suppliers = repo(Supplier);
const Documents = repo(SupplierDocument);

const plugin: FastifyPluginAsyncTypebox = async function (app) {
  app.register(ResponseShape);

  app.route({
    method: 'GET',
    url: '/:id/documents',
    schema: {
      querystring: ListQueryOptions({
        filterable: ['name'],
        orderable: ['name'],
        searchable: ['name'],
      }),
      security: [
        {
          OAuth2: ['supplier@supplier::view'],
        },
      ],
      params: Type.Object({
        id: Type.Number(),
      }),
    },
    async handler(req) {
      // validating references
      const supplier = await Suppliers.findOneByOrFail({ id: req.params.id });

      return new TableQueryBuilder(Documents, req)
        .where(() => {
          return { supplier: { id: supplier.id } };
        })
        .exec();
    },
  });
  app.route({
    method: 'POST',
    url: '/:id/documents',
    schema: {
      security: [
        {
          OAuth2: ['supplier@supplier::update'],
        },
      ],
      params: Type.Object({
        id: Type.Number(),
      }),
      body: Type.Omit(DocumentSchema, [
        'id',
        'supplier',
        'creator',
        'createdAt',
        'updatedAt',
        'deletedAt',
      ]),
    },
    async handler(req) {
      // validating references
      const supplier = await Suppliers.findOneByOrFail({ id: req.params.id });

      return await Documents.save({
        ...req.body,
        supplier,
        creator: { id: req.user.id },
      });
    },
  });
  app.route({
    method: 'DELETE',
    url: '/:id/documents/:dId',
    schema: {
      security: [
        {
          OAuth2: ['supplier@supplier::update'],
        },
      ],
      params: Type.Object({
        id: Type.Number(),
        dId: Type.Number(),
      }),
    },
    async handler(req) {
      // validating references
      const supplier = await Suppliers.findOneByOrFail({ id: req.params.id });

      const { id } = await Documents.findOneByOrFail({
        id: req.params.dId,
      });
      await Documents.delete({
        id,
        supplier: { id: supplier.id },
      });
    },
  });
};

export default plugin;