import { CustomerBank } from '$src/domains/customer/models/Bank';
import { Customer } from '$src/domains/customer/models/Customer';
import { BankSchema } from '$src/domains/customer/schemas/bank.schema';
import ibanValidator from '$src/infra/ibanValidator';
import { repo } from '$src/infra/utils/repo';
import createError from '@fastify/error';
import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';
import { Type } from '@sinclair/typebox';

const CUSTOMER_HAS_NO_BANK = createError(
  'USER_HAS_NO_BANK',
  'this customer has no bank data. set bank data for this customer',
  404,
);

const plugin: FastifyPluginAsyncTypebox = async function (app) {
  const CustomerBanks = repo(CustomerBank);
  const Customers = repo(Customer);
  app.get('/:id/bank', {
    schema: {
      security: [
        {
          OAuth2: ['customer@bank::view'],
        },
      ],
      params: Type.Object({
        id: Type.Integer(),
      }),
    },
    async handler(req) {
      const { id } = req.params;
      const customer = await Customers.findOneByOrFail({ id });

      const bank = await CustomerBanks.findOne({
        where: { customer: { id: customer.id } },
        loadRelationIds: true,
      });

      if (!bank) throw new CUSTOMER_HAS_NO_BANK();

      return bank;
    },
  });

  app.put('/:id/bank', {
    schema: {
      security: [
        {
          OAuth2: ['customer@bank::update'],
        },
      ],
      params: Type.Object({
        id: Type.Integer(),
      }),
      body: Type.Pick(BankSchema, ['iban']),
    },
    async handler(req) {
      const { iban } = req.body;
      const { id } = req.params;

      const customer = await Customers.findOneByOrFail({ id });

      const { bic, bankName } = await ibanValidator(req.body.iban);

      const maybeBank = await CustomerBanks.findOne({
        where: { customer: { id: customer.id } },
      });

      let bankId: number;
      if (!maybeBank) {
        const bank = await CustomerBanks.save({
          iban,
          customer,
          bic,
          bankName,
          creator: { id: req.user.id },
        });

        bankId = bank.id;
      } else {
        await CustomerBanks.update(
          { id: maybeBank.id },
          { iban, bic, bankName },
        );
        bankId = maybeBank.id;
      }

      return await CustomerBanks.findOneByOrFail({ id: bankId });
    },
  });
};

export default plugin;
