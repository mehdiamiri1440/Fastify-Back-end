import { CustomerAddress } from '$src/domains/customer/models/Address';
import { Customer } from '$src/domains/customer/models/Customer';
import { AddressSchema } from '$src/domains/customer/schemas/address.schema';
import { repo } from '$src/infra/utils/repo';
import createError from '@fastify/error';
import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';
import { Type } from '@sinclair/typebox';

const CUSTOMER_HAS_NO_ADDRESS = createError(
  'CUSTOMER_HAS_NO_ADDRESS',
  'this customer has no address.',
  404,
);

const plugin: FastifyPluginAsyncTypebox = async function (app) {
  const Addresses = repo(CustomerAddress);
  const Customers = repo(Customer);

  app.get('/:id/address', {
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

      const address = await Addresses.findOne({
        where: { customer: { id: customer.id } },
        loadRelationIds: true,
      });

      if (!address) {
        throw new CUSTOMER_HAS_NO_ADDRESS();
      }

      return address;
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
      const { id } = req.params;

      const customer = await Customers.findOneByOrFail({
        id,
      });

      const maybeAddress = await Addresses.findOne({
        where: { customer: { id: customer.id } },
        loadRelationIds: true,
      });

      let addressId: number;
      if (!maybeAddress) {
        const address = await Addresses.save({
          ...req.body,
          customer,
          creator: { id: req.user.id },
        });

        addressId = address.id;
      } else {
        await Addresses.update({ id: maybeAddress.id }, { ...req.body });
        addressId = maybeAddress.id;
      }

      return Addresses.findOneByOrFail({ id: addressId });
    },
  });
};

export default plugin;
