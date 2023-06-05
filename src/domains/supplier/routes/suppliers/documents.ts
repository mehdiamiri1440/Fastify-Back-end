import { SupplierDocument } from '$src/domains/supplier/models/Documents';
import { Supplier } from '$src/domains/supplier/models/Supplier';
import { DocumentSchema } from '$src/domains/supplier/schemas/document.schema';
import { ResponseShape } from '$src/infra/Response';
import { OrderBy, PaginatedQueryString } from '$src/infra/tables/PaginatedType';
import { TableQueryBuilder } from '$src/infra/tables/Table';
import { repo } from '$src/infra/utils/repo';
import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';
import { Type } from '@sinclair/typebox';

const Suppliers = repo(Supplier);
const Documents = repo(SupplierDocument);

const plugin: FastifyPluginAsyncTypebox = async function (app) {
  app.register(ResponseShape);

  app.route({
    method: 'GET',
    url: '/:id/documents',
    schema: {
      querystring: PaginatedQueryString({
        orderBy: OrderBy(['id', 'createdAt']),
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
        .where({ supplier: { id: supplier.id } })
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
      body: Type.Pick(DocumentSchema, ['fileId']),
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

      const document = await Documents.findOneByOrFail({
        id: req.params.dId,
        supplier: { id: supplier.id },
      });
      await Documents.softRemove(document);
    },
  });
};

export default plugin;
