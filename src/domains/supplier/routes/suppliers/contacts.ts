import { SupplierContact } from '$src/domains/supplier/models/Contact';
import { Supplier } from '$src/domains/supplier/models/Supplier';
import { ContactSchema } from '$src/domains/supplier/schemas/contact.schema';
import { ResponseShape } from '$src/infra/Response';
import {
  Filter,
  OrderBy,
  PaginatedQueryString,
  Searchable,
} from '$src/infra/tables/PaginatedType';
import { TableQueryBuilder } from '$src/infra/tables/Table';
import { repo } from '$src/infra/utils/repo';
import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';
import { Type } from '@sinclair/typebox';

const plugin: FastifyPluginAsyncTypebox = async function (app) {
  app.register(ResponseShape);

  const Suppliers = repo(Supplier);
  const SupplierContacts = repo(SupplierContact);

  app.route({
    method: 'GET',
    url: '/:id/contacts',
    schema: {
      querystring: PaginatedQueryString({
        orderBy: OrderBy(['id', 'createdAt', 'name']),
        filter: Filter({
          name: Searchable(),
        }),
      }),
      security: [
        {
          OAuth2: ['supplier@supplier::view'],
        },
      ],
      params: Type.Object({
        id: Type.Integer(),
      }),
    },
    async handler(req) {
      // validating references
      const supplier = await Suppliers.findOneByOrFail({ id: req.params.id });

      return new TableQueryBuilder(SupplierContacts, req)
        .where({ supplier: { id: supplier.id } })
        .exec();
    },
  });
  app.route({
    method: 'POST',
    url: '/:id/contacts',
    schema: {
      security: [
        {
          OAuth2: ['supplier@supplier::update'],
        },
      ],
      params: Type.Object({
        id: Type.Integer(),
      }),
      body: Type.Pick(ContactSchema, [
        'name',
        'surName',
        'position',
        'email',
        'phoneNumber',
      ]),
    },
    async handler(req) {
      // validating references
      const supplier = await Suppliers.findOneByOrFail({ id: req.params.id });

      return await SupplierContacts.save({
        ...req.body,
        supplier,
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
          OAuth2: ['supplier@supplier::update'],
        },
      ],
      params: Type.Object({
        id: Type.Integer(),
        cId: Type.Integer(),
      }),
      body: Type.Pick(ContactSchema, [
        'name',
        'surName',
        'position',
        'email',
        'phoneNumber',
      ]),
    },
    async handler(req) {
      // validating references
      const supplier = await Suppliers.findOneByOrFail({ id: req.params.id });

      const { id } = await SupplierContacts.findOneByOrFail({
        id: req.params.cId,
      });
      await SupplierContacts.update(
        { id, supplier: { id: supplier.id } },
        {
          ...req.body,
          supplier,
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
          OAuth2: ['supplier@supplier::update'],
        },
      ],
      params: Type.Object({
        id: Type.Integer(),
        cId: Type.Integer(),
      }),
    },
    async handler(req) {
      // validating references
      const supplier = await Suppliers.findOneByOrFail({ id: req.params.id });

      const contact = await SupplierContacts.findOneByOrFail({
        id: req.params.cId,
        supplier: { id: supplier.id },
      });
      await SupplierContacts.softRemove(contact);
    },
  });
};

export default plugin;
