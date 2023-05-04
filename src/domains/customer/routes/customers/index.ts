import { ResponseShape } from '$src/infra/Response';
import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';
import { repo } from '$src/infra/utils/repo';
import { ListQueryOptions } from '$src/infra/tables/schema_builder';
import { TableQueryBuilder } from '$src/infra/tables/Table';
import { Type } from '@sinclair/typebox';
import { CustomerSchema } from '$src/domains/customer/schemas/customer.schema';
import { Customer } from '$src/domains/customer/models/Customer';
import { Nationality } from '$src/domains/customer/models/Nationality';
import createError from '@fastify/error';
import { isBusiness } from '$src/domains/customer/statics/subscriberTypes';

const NOT_NEED_BUSINESS_DATA = createError(
  'NOT_NEED_BUSINESS_DATA',
  'this subscriber type not need business data',
  409,
);
const NEED_BUSINESS_DATA = createError(
  'NEED_BUSINESS_DATA',
  'this subscriber type need business data',
  409,
);

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
        filterable: ['name'],
        orderable: ['name'],
        searchable: ['name'],
      }),
    },
    async handler(req) {
      return new TableQueryBuilder(Customers, req).exec();
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
      // validating references
      const nationality = await Nationalities.findOneByOrFail({
        id: req.body.nationality,
      });

      // check if subscriber type need business data, business data exist else business data must not exist
      const allBusinessData =
        req.body.businessName &&
        req.body.businessFiscalId &&
        req.body.businessDocumentType;
      const anyBusinessData =
        req.body.businessName ||
        req.body.businessFiscalId ||
        req.body.businessDocumentType;

      const needBusinessData = isBusiness(req.body.subscriberType);

      if (needBusinessData) {
        if (!allBusinessData) throw new NEED_BUSINESS_DATA();
      } else {
        if (anyBusinessData) throw new NOT_NEED_BUSINESS_DATA();
      }

      return await Customers.save({
        ...req.body,
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
