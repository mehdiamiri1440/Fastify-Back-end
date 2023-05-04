import { ResponseShape } from '$src/infra/Response';
import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';
import { repo } from '$src/infra/utils/repo';
import { ListQueryOptions } from '$src/infra/tables/schema_builder';
import { TableQueryBuilder } from '$src/infra/tables/Table';
import { Type } from '@sinclair/typebox';
import { Customer } from '$src/domains/customer/models/Customer';
import { CustomerContact } from '$src/domains/customer/models/Contact';
import createError from '@fastify/error';
import { isBusiness } from '$src/domains/customer/statics/subscriberTypes';
import { ContactSchema } from '$src/domains/customer/schemas/contact.schema';

const NEED_NAME_DATA = createError(
  'NEED_NAME_DATA',
  'this subscriber type need name',
  409,
);

const Customers = repo(Customer);
const Contacts = repo(CustomerContact);

const plugin: FastifyPluginAsyncTypebox = async function (app) {
  app.register(ResponseShape);

  app.route({
    method: 'GET',
    url: '/:id/contacts',
    schema: {
      security: [
        {
          OAuth2: ['customer@contact::list'],
        },
      ],
      querystring: ListQueryOptions({
        filterable: ['name'],
        orderable: ['name'],
        searchable: ['name'],
      }),
      params: Type.Object({
        id: Type.Number(),
      }),
    },
    async handler(req) {
      // validating references
      const customer = await Customers.findOneByOrFail({
        id: req.params.id,
      });

      return (
        new TableQueryBuilder(Contacts, req)
          // this where is for filter contacts that for customer
          .where(() => {
            return { customer: { id: customer.id } };
          })
          .exec()
      );
    },
  });

  app.route({
    method: 'POST',
    url: '/:id/contacts',
    schema: {
      security: [
        {
          OAuth2: ['customer@contact::create'],
        },
      ],
      body: Type.Omit(ContactSchema, [
        'id',
        'customer',
        'creator',
        'createdAt',
        'updatedAt',
        'deletedAt',
      ]),
      params: Type.Object({
        id: Type.Number(),
      }),
    },
    async handler(req) {
      // validating references
      const customer = await Customers.findOneByOrFail({
        id: req.params.id,
      });

      // check if subscriber type need business data, business data exist else business data must not exist
      const needBusinessData = isBusiness(customer.subscriberType);

      if (needBusinessData) {
        if (!req.body.name) throw new NEED_NAME_DATA();
      }

      return await Contacts.save({
        ...req.body,
        customer,
        creator: { id: req.user.id },
      });
    },
  });

  app.route({
    method: 'PUT',
    url: '/:id/contacts/:cId',
    schema: {
      security: [
        {
          OAuth2: ['customer@specification::update'],
        },
      ],
      params: Type.Object({
        id: Type.Number(),
        cId: Type.Number(),
      }),
      body: Type.Omit(ContactSchema, [
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

      // check if subscriber type need business data, business data exist else business data must not exist
      const needBusinessData = isBusiness(customer.subscriberType);

      if (needBusinessData) {
        if (!req.body.name) throw new NEED_NAME_DATA();
      }

      const { id } = await Contacts.findOneByOrFail({
        id: req.params.cId,
        customer: { id: customer.id },
      });
      await Contacts.update(
        { id },
        {
          ...req.body,
          customer,
        },
      );
    },
  });

  app.route({
    method: 'DELETE',
    url: '/:id/contacts/:cId',
    schema: {
      security: [
        {
          OAuth2: ['customer@contact::delete'],
        },
      ],
      params: Type.Object({
        id: Type.Number(),
        cId: Type.Number(),
      }),
    },
    async handler(req) {
      const customer = await Customers.findOneByOrFail({
        id: req.params.id,
      });

      const { id } = await Contacts.findOneByOrFail({
        id: req.params.cId,
        customer: { id: customer.id },
      });
      await Contacts.delete({ id });
    },
  });
};

export default plugin;
