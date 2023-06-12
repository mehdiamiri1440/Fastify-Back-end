import { Customer } from '$src/domains/customer/models/Customer';
import { CustomerDocument } from '$src/domains/customer/models/Document';
import { DocumentSchema } from '$src/domains/customer/schemas/document.schema';
import { File } from '$src/domains/files/models/File';
import { ResponseShape } from '$src/infra/Response';
import { OrderBy, PaginatedQueryString } from '$src/infra/tables/PaginatedType';
import { TableQueryBuilder } from '$src/infra/tables/Table';
import { repo } from '$src/infra/utils/repo';
import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';
import { Type } from '@sinclair/typebox';

const plugin: FastifyPluginAsyncTypebox = async function (app) {
  const Customers = repo(Customer);
  const Documents = repo(CustomerDocument);
  const Files = repo(File);

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
        .relation({ file: true })
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
      const file = await Files.findOneByOrFail({ id: req.body.fileId });

      const document = await Documents.save({
        file,
        customer,
        creator: { id: req.user.id },
      });

      return Documents.findOneOrFail({
        where: { id: document.id },
        relations: {
          file: true,
        },
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
