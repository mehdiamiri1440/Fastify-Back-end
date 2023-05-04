import { repo } from '$src/infra/utils/repo';
import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';
import { Type } from '@sinclair/typebox';
import { Customer } from '$src/domains/customer/models/Customer';
import { CustomerSchema } from '$src/domains/customer/schemas/customer.schema';
import { isBusiness } from '$src/domains/customer/statics/subscriberTypes';
import { Nationality } from '$src/domains/customer/models/Nationality';
import createError from '@fastify/error';

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
  app.route({
    method: 'GET',
    url: '/:id/specification',
    schema: {
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
      return await Customers.findOneOrFail({
        where: { id: req.params.id },
        loadRelationIds: true,
      });
    },
  });
  app.route({
    method: 'PUT',
    url: '/:id/specification',
    schema: {
      security: [
        {
          OAuth2: ['customer@specification::update'],
        },
      ],
      params: Type.Object({
        id: Type.Number(),
      }),
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

      const { id } = await Customers.findOneByOrFail({
        id: req.params.id,
      });
      await Customers.update(
        { id },
        {
          ...req.body,
          nationality,
        },
      );
    },
  });
};

export default plugin;
