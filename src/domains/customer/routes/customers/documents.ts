import { repo } from '$src/infra/utils/repo';
import { ResponseShape } from '$src/infra/Response';
import { ListQueryOptions } from '$src/infra/tables/schema_builder';
import { TableQueryBuilder } from '$src/infra/tables/Table';
import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';
import { Type } from '@sinclair/typebox';
import { DocumentSchema } from '$src/domains/customer/schemas/document.schema';
import { CustomerDocument } from '$src/domains/customer/models/Document';
import { Customer } from '$src/domains/customer/models/Customer';

const Customers = repo(Customer);
const Documents = repo(CustomerDocument);

const plugin: FastifyPluginAsyncTypebox = async function (app) {
  app.register(ResponseShape);

  app.route({
    method: 'GET',
    url: '/:id/documents',
    schema: {
      querystring: ListQueryOptions({
        filterable: [],
        orderable: [],
        searchable: [],
      }),
      security: [
        {
          OAuth2: ['customer@specification::view'],
        },
      ],
      params: Type.Object({
        id: Type.Number(),
      }),
    },
    async handler(req) {
      // validating references
      const customer = await Customers.findOneByOrFail({ id: req.params.id });

      return new TableQueryBuilder(Documents, req)
        .where({ customer: { id: customer.id } })
        .exec();
    },
  });
  app.route({
    method: 'POST',
    url: '/:id/documents',
    schema: {
      security: [
        {
          OAuth2: ['customer@specification::update'],
        },
      ],
      params: Type.Object({
        id: Type.Number(),
      }),
      body: Type.Pick(DocumentSchema, ['fileId']),
    },
    async handler(req) {
      // validating references
      const customer = await Customers.findOneByOrFail({ id: req.params.id });

      return await Documents.save({
        fileId: req.body.fileId,
        customer,
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
          OAuth2: ['customer@specification::update'],
        },
      ],
      params: Type.Object({
        id: Type.Number(),
        dId: Type.Number(),
      }),
    },
    async handler(req) {
      // validating references
      const customer = await Customers.findOneByOrFail({ id: req.params.id });

      const document = await Documents.findOneByOrFail({
        id: req.params.dId,
        customer: { id: customer.id },
      });
      await Documents.softRemove(document);
    },
  });
};

export default plugin;
