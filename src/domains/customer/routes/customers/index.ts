import { Customer } from '$src/domains/customer/models/Customer';
import { Nationality } from '$src/domains/customer/models/Nationality';
import { CustomerSchema } from '$src/domains/customer/schemas/customer.schema';
import { ResponseShape } from '$src/infra/Response';
import { TableQueryBuilder } from '$src/infra/tables/Table';
import { ListQueryOptions } from '$src/infra/tables/schema_builder';
import { repo } from '$src/infra/utils/repo';
import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';
import { Type } from '@sinclair/typebox';
import { validateCustomerData } from '../../utils';

const Customers = repo(Customer);
const Nationalities = repo(Nationality);

const plugin: FastifyPluginAsyncTypebox = async function (app) {
  app.register(ResponseShape);

  app.route({
    method: 'GET',
    url: '/',
    schema: {
      security: [
        {
          OAuth2: ['customer@customer::list'],
        },
      ],
      querystring: ListQueryOptions({
        filterable: ['isActive'],
        orderable: ['id', 'name', 'fiscalId', 'email', 'createdAt', 'isActive'],
        searchable: ['id', 'name', 'fiscalId', 'email'],
      }),
    },
    async handler(req) {
      return new TableQueryBuilder(Customers, req)
        .relation(() => ({
          addresses: true,
          nationality: true,
        }))
        .exec();
    },
  });

  app.route({
    method: 'POST',
    url: '/',
    schema: {
      security: [
        {
          OAuth2: ['customer@customer::create'],
        },
      ],
      body: Type.Omit(CustomerSchema, [
        'id',
        'creator',
        'createdAt',
        'updatedAt',
        'deletedAt',
      ]),
    },
    async handler(req) {
      const {
        nationalityId,
        businessName,
        businessFiscalId,
        businessDocumentType,
        subscriberType,
        ...restBody
      } = req.body;

      const nationality = await Nationalities.findOneByOrFail({
        id: nationalityId,
      });

      validateCustomerData({
        businessName,
        businessFiscalId,
        businessDocumentType,
        subscriberType,
      });

      return await Customers.save({
        ...restBody,
        businessName,
        businessFiscalId,
        businessDocumentType,
        subscriberType,
        nationality,
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
          OAuth2: ['customer@customer::delete'],
        },
      ],
      params: Type.Object({
        id: Type.Number(),
      }),
    },
    async handler(req) {
      const { id } = await Customers.findOneByOrFail({ id: req.params.id });
      await Customers.delete({ id });
    },
  });
  await app.register(import('./specification'));
  await app.register(import('./documents'));
  await app.register(import('./contacts'));
  await app.register(import('./address'));
  await app.register(import('./bank'));
};

export default plugin;
