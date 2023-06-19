import { CustomerContact } from '$src/domains/customer/models/Contact';
import { Customer } from '$src/domains/customer/models/Customer';
import { ContactSchema } from '$src/domains/customer/schemas/contact.schema';
import { isBusiness } from '$src/domains/customer/statics/subscriberTypes';
import { ResponseShape } from '$src/infra/Response';
import { OrderBy, PaginatedQueryString } from '$src/infra/tables/PaginatedType';
import { TableQueryBuilder } from '$src/infra/tables/Table';
import { repo } from '$src/infra/utils/repo';
import createError from '@fastify/error';
import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';
import { Type } from '@sinclair/typebox';

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
      querystring: PaginatedQueryString({
        orderBy: OrderBy(['id', 'createdAt']),
      }),
      params: Type.Object({
        id: Type.Integer(),
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
          .where({ customer: { id: customer.id } })
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
      body: Type.Pick(ContactSchema, [
        'position',
        'name',
        'surName',
        'email',
        'phoneNumber',
      ]),
      params: Type.Object({
        id: Type.Integer(),
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
    url: '/:customerId/contacts/:contactId',
    schema: {
      security: [
        {
          OAuth2: ['customer@specification::update'],
        },
      ],
      params: Type.Object({
        customerId: Type.Integer(),
        contactId: Type.Integer(),
      }),
      body: Type.Pick(ContactSchema, [
        'position',
        'name',
        'surName',
        'email',
        'phoneNumber',
      ]),
    },
    async handler(req) {
      const { customerId, contactId } = req.params;

      const customer = await Customers.findOneByOrFail({ id: customerId });

      // check if subscriber type need business data, business data exist else business data must not exist
      const needBusinessData = isBusiness(customer.subscriberType);

      if (needBusinessData) {
        if (!req.body.name) throw new NEED_NAME_DATA();
      }

      const { id } = await Contacts.findOneByOrFail({
        id: contactId,
        customer: { id: customer.id },
      });

      await Contacts.update(
        { id },
        {
          ...req.body,
          customer,
        },
      );

      return Contacts.findOneByOrFail({ id: contactId });
    },
  });

  app.route({
    method: 'DELETE',
    url: '/:customerId/contacts/:contactId',
    schema: {
      security: [
        {
          OAuth2: ['customer@contact::delete'],
        },
      ],
      params: Type.Object({
        customerId: Type.Integer(),
        contactId: Type.Integer(),
      }),
    },
    async handler(req) {
      const { contactId, customerId } = req.params;

      const customer = await Customers.findOneByOrFail({
        id: customerId,
      });

      const contact = await Contacts.findOneByOrFail({
        id: contactId,
        customer: { id: customer.id },
      });
      await Contacts.softRemove(contact);
    },
  });
};

export default plugin;
