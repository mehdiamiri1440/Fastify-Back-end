import { repo } from '$src/infra/utils/repo';
import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';
import { Type } from '@sinclair/typebox';
import { Customer } from '$src/domains/customer/models/Customer';
import { CustomerBank } from '$src/domains/customer/models/Bank';
import { BankSchema } from '$src/domains/customer/schemas/bank.schema';
import ibanValidator from '$src/infra/ibanValidator';

const Banks = repo(CustomerBank);
const Customers = repo(Customer);

const plugin: FastifyPluginAsyncTypebox = async function (app) {
  app.route({
    method: 'GET',
    url: '/:id/bank',
    schema: {
      security: [
        {
          OAuth2: ['customer@bank::view'],
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
        ...(await Banks.findOne({
          where: { customer: { id: customer.id } },
          loadRelationIds: true,
        })),
      };
    },
  });
  app.route({
    method: 'PUT',
    url: '/:id/bank',
    schema: {
      security: [
        {
          OAuth2: ['customer@bank::update'],
        },
      ],
      params: Type.Object({
        id: Type.Number(),
      }),
      body: Type.Omit(BankSchema, [
        'id',
        'customer',
        'bic',
        'bankName',
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

      // validating iban
      const { bic, bankName } = await ibanValidator(req.body.iban);

      // saving bank data
      const bank = await Banks.findOne({
        where: { customer: { id: customer.id } },
        loadRelationIds: true,
      });
      if (!bank) {
        await Banks.save({
          ...req.body,
          customer,
          bic,
          bankName,
          creator: { id: req.user.id },
        });
      } else {
        const { id } = bank;
        await Banks.update({ id }, { ...req.body, bic, bankName });
      }
    },
  });
};

export default plugin;
