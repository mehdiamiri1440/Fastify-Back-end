import { repo } from '$src/databases/typeorm';
import { ResponseShape } from '$src/infra/Response';
import { ListQueryOptions } from '$src/infra/tables/schema_builder';
import { TableQueryBuilder } from '$src/infra/tables/Table';
import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';
import { Supplier } from '$src/domains/supplier/models/Supplier';
import { Contact } from '$src/domains/supplier/models/Contact';
import { Type } from '@sinclair/typebox';
import { ContactSchema } from '$src/domains/supplier/schemas/contact.schema';

const Suppliers = repo(Supplier);
const SupplierContacts = repo(Contact);

const plugin: FastifyPluginAsyncTypebox = async function (app) {
  app.register(ResponseShape);

  app.route({
    method: 'GET',
    url: '/:id/contacts',
    schema: {
      querystring: ListQueryOptions({
        filterable: ['name'],
        orderable: ['name'],
        searchable: ['name'],
      }),
      security: [
        {
          OAuth2: ['supplier@supplier::view'],
        },
      ],
      params: Type.Object({
        id: Type.Number(),
      }),
    },
    async handler(req) {
      // validating references
      const supplier = await Suppliers.findOneByOrFail({ id: req.params.id });

      return new TableQueryBuilder(SupplierContacts, req)
        .where(() => {
          return { supplier: { id: supplier.id } };
        })
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
        id: Type.Number(),
      }),
      body: Type.Omit(ContactSchema, [
        'id',
        'supplier',
        'creator',
        'createdAt',
        'updatedAt',
        'deletedAt',
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
        id: Type.Number(),
        cId: Type.Number(),
      }),
      body: Type.Omit(ContactSchema, [
        'id',
        'supplier',
        'creator',
        'createdAt',
        'updatedAt',
        'deletedAt',
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
        id: Type.Number(),
        cId: Type.Number(),
      }),
    },
    async handler(req) {
      // validating references
      const supplier = await Suppliers.findOneByOrFail({ id: req.params.id });

      const { id } = await SupplierContacts.findOneByOrFail({
        id: req.params.cId,
      });
      await SupplierContacts.delete({
        id,
        supplier: { id: supplier.id },
      });
    },
  });
};

export default plugin;
