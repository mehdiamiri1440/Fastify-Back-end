import { Customer } from '$src/domains/customer/models/Customer';
import { Nationality } from '$src/domains/customer/models/Nationality';
import {
  CustomerSchema,
  documentType,
  subscriberType,
} from '$src/domains/customer/schemas/customer.schema';
import { isBusiness } from '$src/domains/customer/statics/subscriberTypes';
import { repo } from '$src/infra/utils/repo';
import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';
import { Type } from '@sinclair/typebox';
import { validateCustomerData } from '../../utils';

const Customers = repo(Customer);
const Nationalities = repo(Nationality);

const plugin: FastifyPluginAsyncTypebox = async function (app) {
  app.get('/:id/specification', {
    schema: {
      security: [
        {
          OAuth2: ['customer@specification::view'],
        },
      ],
      params: Type.Object({
        id: Type.Integer(),
      }),
    },
    async handler(req) {
      const entity = await Customers.findOneOrFail({
        where: { id: req.params.id },
        relations: {
          nationality: true,
          creator: true,
        },
      });

      return {
        ...entity,
        isBusiness: isBusiness(entity.subscriberType),
      };
    },
  });

  app.put('/:id/specification', {
    schema: {
      security: [
        {
          OAuth2: ['customer@specification::update'],
        },
      ],
      params: Type.Object({
        id: Type.Integer(),
      }),
      body: Type.Pick(CustomerSchema, [
        'name',
        'contactName',
        'subscriberType',
        'documentType',
        'contactDocumentType',
        'fiscalId',
        'contactFiscalId',
        'contactFamily1',
        'contactFamily2',
        'nationalityId',
        'birthday',
        'isActive',
      ]),
    },
    async handler(req) {
      const {
        nationalityId,
        contactName,
        contactFiscalId,
        contactDocumentType,
        subscriberType,
        ...restBody
      } = req.body;

      const nationality = await Nationalities.findOneByOrFail({
        id: nationalityId,
      });

      validateCustomerData({
        contactName,
        contactFiscalId,
        contactDocumentType,
        subscriberType,
      });

      const { id } = await Customers.findOneByOrFail({
        id: req.params.id,
      });
      await Customers.update(
        { id },
        {
          ...restBody,
          contactName,
          contactFiscalId,
          contactDocumentType,
          subscriberType,
          nationality,
        },
      );
    },
  });
};

export default plugin;
