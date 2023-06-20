import { repo } from '$src/infra/utils/repo';
import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';
import { Type } from '@sinclair/typebox';
import { Customer } from '$src/domains/customer/models/Customer';
import { AddressSchema } from '$src/domains/geo/address.schema';
import createError from '@fastify/error';

const CUSTOMER_HAS_NO_ADDRESS = createError(
  'CUSTOMER_HAS_NO_ADDRESS',
  'this customer has no address.',
  404,
);

const plugin: FastifyPluginAsyncTypebox = async function (app) {
  const Customers = repo(Customer);

  app.route({
    method: 'GET',
    url: '/:id/address',
    config: { possibleErrors: [CUSTOMER_HAS_NO_ADDRESS] },
    schema: {
      security: [
        {
          OAuth2: ['customer@address::view'],
        },
      ],
      params: Type.Object({
        id: Type.Integer(),
      }),
    },
    async handler(req) {
      // validating references
      const customer = await Customers.findOneByOrFail({
        id: req.params.id,
      });

      if (!customer.address) {
        throw new CUSTOMER_HAS_NO_ADDRESS();
      }

      return customer.address;
    },
  });
  app.route({
    method: 'PUT',
    url: '/:id/address',
    schema: {
      security: [
        {
          OAuth2: ['customer@address::update'],
        },
      ],
      params: Type.Object({
        id: Type.Integer(),
      }),
      body: Type.Omit(AddressSchema, ['formatted']),
    },
    async handler(req) {
      const { body, params } = req;

      const customer = await Customers.findOneByOrFail({
        id: params.id,
      });

      const address = {
        ...body,
        formatted: `${body.provinceName ?? ''} ${body.cityName ?? ''} ${
          body.streetName ?? ''
        } ${body.postalCode ?? ''} ${body.number ?? ''} ${body.floor ?? ''}-${
          body.door ?? ''
        }`,
      };

      await Customers.update(customer.id, {
        address,
      });

      return address;
    },
  });
};

export default plugin;
