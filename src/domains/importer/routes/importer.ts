import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';
import { Static, Type } from '@sinclair/typebox';
import { SupplierUploaded, supplierTemplate } from '../services/supplier';
import { CustomerUploaded, customerTemplate } from '../services/customer';
import {
  productTemplate,
  ProductUploaded,
} from '$src/domains/importer/services/product';
import {
  NEED_BUSINESS_DATA,
  NOT_NEED_BUSINESS_DATA,
} from '$src/domains/customer/errors';
import { NOT_VALID } from '$src/domains/importer/errors';

const plugin: FastifyPluginAsyncTypebox = async function (app) {
  app.route({
    method: 'GET',
    url: '/suppliers/template.csv',
    async handler(req, res) {
      res.header('Content-Type', 'text/csv').send(supplierTemplate());
    },
  });
  app.route({
    method: 'POST',
    url: '/suppliers/insert',
    config: { possibleErrors: [NOT_VALID] },
    schema: {
      security: [
        {
          OAuth2: ['importer@upload'],
        },
      ],
      body: Type.Object({
        fileId: Type.String(),
      }),
    },
    async handler(req) {
      const uploaded = new SupplierUploaded(req.user.id, req.body.fileId);
      return await uploaded.insert();
    },
  });
  app.route({
    method: 'POST',
    url: '/suppliers/check',
    config: { possibleErrors: [NOT_VALID] },
    schema: {
      security: [
        {
          OAuth2: [],
        },
      ],
      body: Type.Object({
        fileId: Type.String(),
      }),
    },
    async handler(req) {
      const uploaded = new SupplierUploaded(req.user.id, req.body.fileId);
      return await uploaded.parse();
    },
  });
  app.route({
    method: 'GET',
    url: '/products/template.csv',
    async handler(req, res) {
      res.header('Content-Type', 'text/csv').send(productTemplate());
    },
  });
  app.route({
    method: 'POST',
    url: '/products/insert',
    config: { possibleErrors: [NOT_VALID] },
    schema: {
      security: [
        {
          OAuth2: ['importer@upload'],
        },
      ],
      body: Type.Object({
        fileId: Type.String(),
      }),
    },
    async handler(req) {
      const uploaded = new ProductUploaded(req.user.id, req.body.fileId);
      return await uploaded.insert();
    },
  });
  app.route({
    method: 'POST',
    url: '/products/check',
    config: { possibleErrors: [NOT_VALID] },
    schema: {
      security: [
        {
          OAuth2: [],
        },
      ],
      body: Type.Object({
        fileId: Type.String(),
      }),
    },
    async handler(req) {
      const uploaded = new ProductUploaded(req.user.id, req.body.fileId);
      return await uploaded.parse();
    },
  });
  app.route({
    method: 'GET',
    url: '/customers/template.csv',
    async handler(req, res) {
      res.header('Content-Type', 'text/csv').send(customerTemplate());
    },
  });
  app.route({
    method: 'POST',
    url: '/customers/insert',
    config: {
      possibleErrors: [NOT_VALID, NEED_BUSINESS_DATA, NOT_NEED_BUSINESS_DATA],
    },
    schema: {
      security: [
        {
          OAuth2: ['importer@upload'],
        },
      ],
      body: Type.Object({
        fileId: Type.String(),
      }),
    },
    async handler(req) {
      const uploaded = new CustomerUploaded(req.user.id, req.body.fileId);
      return await uploaded.insert();
    },
  });
  app.route({
    method: 'POST',
    url: '/customers/check',
    config: {
      possibleErrors: [NOT_VALID, NEED_BUSINESS_DATA, NOT_NEED_BUSINESS_DATA],
    },
    schema: {
      security: [
        {
          OAuth2: [],
        },
      ],
      body: Type.Object({
        fileId: Type.String(),
      }),
    },
    async handler(req) {
      const uploaded = new CustomerUploaded(req.user.id, req.body.fileId);
      return await uploaded.parse();
    },
  });
};

export default plugin;
