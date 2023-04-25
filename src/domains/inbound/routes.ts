import { repo } from '$src/infra/utils/repo';
import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';
import { Product } from '../product/models/Product';
import { Supplier } from '../supplier/models/Supplier';
import { Inbound } from './models/Inbound';

const Inbounds = repo(Inbound);
const Products = repo(Product);
const Suppliers = repo(Supplier);

const plugin: FastifyPluginAsyncTypebox = async function (app) {
  await app.register(import('./routes/inbounds'), { prefix: '/inbounds' });
  await app.register(import('./routes/inbound-products'), {
    prefix: '/inbound-products',
  });
};

export default plugin;
