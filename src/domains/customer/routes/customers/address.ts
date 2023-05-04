import { repo } from '$src/infra/utils/repo';
import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';
import { Type } from '@sinclair/typebox';
import { Customer } from '$src/domains/customer/models/Customer';
import { CustomerAddress } from '$src/domains/customer/models/Address';
import { AddressSchema } from '$src/domains/customer/schemas/address.schema';

const Addresses = repo(CustomerAddress);
const Customers = repo(Customer);

const plugin: FastifyPluginAsyncTypebox = async function (app) {
  app.route({
    method: 'GET',
    url: '/:id/address',
    schema: {
      security: [
        {
          OAuth2: ['customer@address::view'],
        },
      ],
      params: Type.Object({
        id: Type.Number(),
      }),
    },
    async handler(req) {
      // validating references
      const customer = await Customers.findOneByOrFail({
        id: req.params.id,
      });

      return {
        ...(await Addresses.findOne({
          where: { customer: { id: customer.id } },
          loadRelationIds: true,
        })),
      };
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
        id: Type.Number(),
      }),
      body: Type.Omit(AddressSchema, [
        'id',
        'customer',
        'creator',
        'createdAt',
        'updatedAt',
        'deletedAt',
      ]),
    },
    async handler(req) {
      // validating references
      const customer = await Customers.findOneByOrFail({
        id: req.params.id,
      });

      const address = await Addresses.findOne({
        where: { customer: { id: customer.id } },
        loadRelationIds: true,
      });
      if (!address) {
        await Addresses.save({
          ...req.body,
          customer,
          creator: { id: req.user.id },
        });
      } else {
        const { id } = address;
        await Addresses.update({ id }, { ...req.body });
      }
    },
  });
};

export default plugin;
